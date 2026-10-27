import { promises as fs } from "fs";
import path from "path";
import { splitList } from "./activity-week-conflicts";
import { friendlyGitHubError, githubStore, githubStoreEnabled } from "./github-store";
import { ACTIVITY_WEEK_SEED } from "./activity-week-seed";
import type {
  ActivityEntry,
  ActivityRevision,
  ActivitySubmission,
  ConflictItem,
} from "./activity-week-types";

/**
 * 呢個 app 淨係做「同事登記」同埋「睇已知活動」。
 *
 * 儲存位置同行政管理平台共用：GitHub store 嘅 `activity-week/subs.json`。
 * 兩邊都寫同一個檔，所以每次寫入之前一定要重新讀最新版本，
 * 否則會蓋咗對方啱啱改咗嘅內容。
 *
 * 呢個 app 唔會改 seed（內建活動），亦唔會做排課，
 * 所以只需要 handle submissions 嗰部分。
 */

type StoreShape = {
  submissions: ActivitySubmission[];
  revisions: Record<string, ActivityRevision>;
  placements: unknown[];
  placementsSeeded: boolean;
  updatedAt: string;
};

const LOCAL_PATH = path.join(process.cwd(), "data", "activity-week-subs.json");
/** Same Cover store repo, dedicated path already used on Production. */
const META_PATHNAME = "activity-week/subs.json";

declare global {
  var __hujiangAwSubs: StoreShape | undefined;
  var __hujiangAwSha: string | null | undefined;
  var __hujiangAwSubsLock: Promise<void> | undefined;
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function emptyStore(): StoreShape {
  return {
    submissions: [],
    revisions: {},
    placements: [],
    placementsSeeded: false,
    updatedAt: new Date().toISOString(),
  };
}

function isStore(v: unknown): v is Partial<StoreShape> & { submissions: unknown } {
  if (!v || typeof v !== "object") return false;
  return Array.isArray((v as { submissions?: unknown }).submissions);
}

function normalize(raw: Partial<StoreShape>): StoreShape {
  const revisions =
    raw.revisions && typeof raw.revisions === "object" && !Array.isArray(raw.revisions)
      ? raw.revisions
      : {};
  return {
    submissions: Array.isArray(raw.submissions) ? raw.submissions : [],
    revisions,
    placements: Array.isArray(raw.placements) ? raw.placements : [],
    placementsSeeded: Boolean(raw.placementsSeeded),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

async function readLocal(): Promise<StoreShape | null> {
  try {
    const raw = await fs.readFile(LOCAL_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return isStore(parsed) ? normalize(parsed) : null;
  } catch {
    return null;
  }
}

async function writeLocal(store: StoreShape): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, JSON.stringify(store, null, 2), "utf8");
}

async function readGithub(): Promise<{ store: StoreShape; sha: string } | null> {
  if (!githubStoreEnabled()) return null;
  const file = await githubStore.read(META_PATHNAME);
  if (!file) return null;
  const parsed = JSON.parse(file.text) as unknown;
  if (!isStore(parsed)) return null;
  return { store: normalize(parsed), sha: file.sha };
}

async function writeGithub(store: StoreShape, sha: string | null): Promise<string> {
  return githubStore.write(
    META_PATHNAME,
    JSON.stringify(store, null, 2),
    sha,
    "update activity-week/subs.json",
  );
}

/**
 * 每次都讀返 GitHub 最新版本先寫。
 *
 * 之前個做法係攞住一份舊嘅 store 喺記憶體改完就成份寫返去，
 * 但而家兩個 project 都寫同一個檔，所以咁做會蓋咗對方啱啱改嘅嘢。
 * 而家每次寫之前都重讀，寫入時用最新 sha；
 * 如果中間撞到人改（409），就重讀再試。
 */
async function persist(store: StoreShape): Promise<void> {
  store.updatedAt = new Date().toISOString();
  if (githubStoreEnabled()) {
    // 直接寫；撞到 409 就交返俾 mutate() 重讀再試。
    // （之前呢度自己重試，但用緊一份舊 snapshot 寫，
    //   會蓋咗對方啱啱寫入嘅另一筆登記。）
    globalThis.__hujiangAwSha = await writeGithub(store, globalThis.__hujiangAwSha ?? null);
  } else if (process.env.VERCEL) {
    throw new Error("GitHub store 未設定（GITHUB_STORE_TOKEN）");
  } else {
    await writeLocal(store);
  }
  globalThis.__hujiangAwSubs = clone(store);
}

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = globalThis.__hujiangAwSubsLock ?? Promise.resolve();
  let release!: () => void;
  globalThis.__hujiangAwSubsLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

async function load(): Promise<StoreShape> {
  if (githubStoreEnabled()) {
    const fromGithub = await readGithub();
    const store = fromGithub?.store ?? emptyStore();
    globalThis.__hujiangAwSha = fromGithub?.sha ?? null;
    globalThis.__hujiangAwSubs = store;
    return clone(store);
  }
  const fromLocal = await readLocal();
  const store = fromLocal ?? emptyStore();
  globalThis.__hujiangAwSubs = store;
  return clone(store);
}

/**
 * 改資料嘅統一入口：每次都重讀最新版本，套用改動，再寫返。
 *
 * 公開登記站（呢個 project）同管理平台都寫同一個 GitHub store 檔，
 * 所以唔可以攞住一份舊 snapshot 就成份寫返去，
 * 否則會蓋咗另一邊啱啱登記／修改嘅內容。
 *
 * 如果寫入時撞到人改（409），就重讀最新版本再重新套用同一個改動。
 */
async function mutate<T>(
  apply: (store: StoreShape) => T | Promise<T>,
): Promise<T> {
  if (!githubStoreEnabled()) {
    const store = await load();
    const result = await apply(store);
    await persist(store);
    return result;
  }
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    // 每次都重讀，確保改動係基於最新版本。
    const store = await load();
    const result = await apply(store);
    try {
      await persist(store);
      return result;
    } catch (err) {
      lastError = err;
      const status = (err as { status?: number }).status;
      if (status !== 409) throw new Error(friendlyGitHubError(err));
      // 有其他人喺我哋寫入之前改咗個檔：下一輪重讀再套用同一個改動。
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("GitHub store 寫入衝突，請稍後再試");
}

export function persistenceMode(): "github" | "local-json" {
  return githubStoreEnabled() ? "github" : "local-json";
}

export type EditablePatch = {
  title?: string;
  dateOrWindow?: string;
  periods?: string[] | string;
  venue?: string;
  audience?: string;
  owner?: string;
  /** PDF 表格「科任、活動時長」入面嘅科任老師。 */
  subjectTeachers?: string;
  hold?: boolean;
  notes?: string;
  track?: string;
};

function asPeriods(value: string[] | string | undefined, fallback: string[]): string[] {
  if (Array.isArray(value)) return value.map((p) => p.trim()).filter(Boolean);
  if (typeof value === "string") return splitList(value);
  return fallback;
}

export function mergeEntries(store: StoreShape): ActivityEntry[] {
  const builtins: ActivityEntry[] = ACTIVITY_WEEK_SEED.seed.map((seed) => {
    const rev = store.revisions[seed.id];
    if (!rev) {
      return {
        ...seed,
        subjectTeachers: "",
        source: "seed",
        revised: false,
      };
    }
    return {
      id: seed.id,
      title: rev.title,
      dateOrWindow: rev.dateOrWindow,
      periods: rev.periods,
      venue: rev.venue,
      audience: rev.audience,
      owner: rev.owner,
      subjectTeachers: rev.subjectTeachers ?? "",
      hold: rev.hold,
      notes: rev.notes,
      track: rev.track,
      builtin: true,
      source: "seed",
      revised: true,
    };
  });
  const submitted: ActivityEntry[] = store.submissions.map((sub) => ({
    id: sub.id,
    title: sub.title,
    dateOrWindow: sub.dateOrWindow,
    periods: sub.periods ?? [],
    venue: sub.venue ?? "",
    audience: sub.audience ?? "",
    owner: sub.owner ?? "",
    subjectTeachers: sub.subjectTeachers ?? "",
    hold: Boolean(sub.hold),
    notes: sub.notes ?? "",
    track: sub.track ?? "",
    builtin: false,
    source: "platform",
    revised: false,
    submittedAt: sub.submittedAt,
    submitterName: sub.submitterName,
  }));
  return [...builtins, ...submitted];
}

export function toConflictItem(entry: ActivityEntry): ConflictItem {
  return {
    id: entry.id,
    title: entry.title,
    dateOrWindow: entry.dateOrWindow,
    periods: entry.periods,
    venue: entry.venue,
    hold: entry.hold,
  };
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getActivityState() {
  return withLock(async () => {
    const store = await load();
    return {
      store,
      entries: mergeEntries(store),
      persistence: persistenceMode(),
    };
  });
}

export async function addSubmission(input: EditablePatch & { submitterName?: string }) {
  const title = (input.title ?? "").trim();
  const dateOrWindow = (input.dateOrWindow ?? "").trim();
  const owner = (input.owner ?? "").trim();
  if (!title) throw new Error("請填活動名稱");
  if (!dateOrWindow) throw new Error("請填日期");
  if (!owner) throw new Error("請填負責老師");
  return withLock(async () => {
    // 每次都重讀最新版本，確保唔會蓋咗平台上啱啱新增／修改嘅登記。
    return mutate((store) => {
      const submission: ActivitySubmission = {
        id: uid("sub"),
        title,
        dateOrWindow,
        periods: asPeriods(input.periods, []),
        venue: (input.venue ?? "").trim(),
        audience: (input.audience ?? "").trim(),
        owner,
        subjectTeachers: (input.subjectTeachers ?? "").trim(),
        hold: Boolean(input.hold),
        notes: (input.notes ?? "").trim(),
        track: (input.track ?? "").trim() || undefined,
        submittedAt: new Date().toISOString(),
        submitterName: input.submitterName?.trim() || undefined,
      };
      store.submissions.unshift(submission);
      return submission;
    });
  });
}
