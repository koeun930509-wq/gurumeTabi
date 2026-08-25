// 빌드 시점에 Supabase restaurants 테이블을 조회해 public/sitemap.xml을 생성한다.
// SPA(react-router-dom)라 런타임에는 sitemap을 만들 수 없어 `npm run build` 전 단계로 실행함.
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL = "https://gurume-tabi.com";
const OUTPUT_PATH = resolve(__dirname, "../public/sitemap.xml");

// Vercel 등 배포 환경은 환경변수를 process.env에 직접 주입하지만, 로컬 개발 시에는 .env 파일을 읽어야
// 한다 — Vite는 이 파싱을 자동으로 해주지만 이 스크립트는 Vite 밖에서 순수 Node로 실행되므로 직접 처리.
function loadDotEnv() {
  const envPath = resolve(__dirname, "../.env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const [, key, rawValue = ""] = match;
    if (!(key in process.env)) {
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }
}
loadDotEnv();

const STATIC_PAGES = [
  { path: "/", priority: "1.0" },
  { path: "/search", priority: "0.9" },
  { path: "/nearby", priority: "0.8" },
];

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

function xmlEscape(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(loc, lastmod, priority) {
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>${lastmodTag}\n    <priority>${priority}</priority>\n  </url>`;
}

async function fetchAllRestaurantIds() {
  if (!supabaseUrl || !supabaseKey) {
    console.warn("[sitemap] VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY가 없어 가게 상세 페이지 없이 생성합니다.");
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const rows = [];
  const pageSize = 1000;
  // restaurants.js의 fetchRestaurants()와 동일한 이유(PostgREST 기본 1000행 제한)로 페이지네이션 필요.
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("restaurants")
      .select("id, updated_at")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const staticEntries = STATIC_PAGES.map((p) => urlEntry(`${SITE_URL}${p.path}`, today, p.priority));

  const restaurants = await fetchAllRestaurantIds();
  const restaurantEntries = restaurants.map((r) =>
    urlEntry(`${SITE_URL}/place/${r.id}`, r.updated_at ? r.updated_at.slice(0, 10) : today, "0.6")
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticEntries, ...restaurantEntries].join("\n")}\n</urlset>\n`;

  writeFileSync(OUTPUT_PATH, xml, "utf-8");
  console.log(`[sitemap] ${staticEntries.length + restaurantEntries.length}개 URL로 생성 완료 → ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("[sitemap] 생성 실패:", err);
  process.exit(1);
});
