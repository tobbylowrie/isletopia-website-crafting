<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  RecipeCard,
  parseRecipe,
  recipeTitle,
  itemSearchNames,
  tagMembers,
  prettyTagLabel,
  zhDisplayName,
} from './components/crafting'
import type { ParsedRecipe, RecipeKind, VanillaRecipeJson } from './components/crafting'
import { VANILLA_RECIPES } from './data/vanilla-recipes'
import { CUSTOM_RECIPES } from './data/custom-recipes'

/* ------- 原版配方目录（26.3 全量 2042 条） ------- */

/** 筛选类别：'custom' 为内置自定义配方，'favorites' 为收藏，其余为原版配方的面板种类 */
type CatalogCategory = RecipeKind | 'all' | 'custom' | 'favorites'

interface CatalogEntry {
  id: string
  raw: VanillaRecipeJson
  kind: RecipeKind | null
  /** 自定义配方（独立于原版分类展示） */
  custom?: boolean
  title: string
  searchText: string
}

/** 面板种类 → 筛选按钮文案 */
const KIND_LABELS: { kind: CatalogCategory; label: string }[] = [
  { kind: 'all', label: '全部' },
  { kind: 'favorites', label: '已收藏' },
  { kind: 'custom', label: '自定义配方' },
  { kind: 'crafting', label: '合成' },
  { kind: 'furnace', label: '熔炼' },
  { kind: 'brewing', label: '酿造' },
  { kind: 'stonecutter', label: '切石' },
  { kind: 'smithing', label: '锻造' },
]

/** 目录排序：自定义配方置顶，原版按面板种类分区（解析失败的排最后），区内按注册 id 字典序 */
const KIND_ORDER: Record<RecipeKind, number> = {
  crafting: 0,
  furnace: 1,
  brewing: 2,
  stonecutter: 3,
  smithing: 4,
}

/**
 * 目录搜索索引：配方 id + 产物/原料的中文名、英文名、物品 id；
 * tag 原料额外展开 tag id、英文名与全部成员物品名，实现按标签及标签成员搜索。
 * 合成燃料组（cooking.fuel）仅作展示，不参与索引，避免燃料成员污染结果。
 */
function buildSearchText(id: string, parsedRecipe: ParsedRecipe): string {
  const parts: string[] = [id, id.replace(/^minecraft:/, '')]
  for (const [key, slot] of Object.entries(parsedRecipe.slots)) {
    if (key === 'cooking.fuel') continue
    parts.push(slot.id, slot.id.replace(/^minecraft:/, ''))
    if (slot.nameKey) {
      // 药水等带组件物品：键名本身可搜（如 strength），同时解析出中文显示名（如 滞留型力量药水）
      parts.push(slot.nameKey)
      const nameKeyText = zhDisplayName(slot.nameKey)
      if (nameKeyText) parts.push(nameKeyText)
    }
    if (slot.isTag) {
      parts.push(prettyTagLabel(slot.id))
      for (const member of tagMembers(slot.id) ?? []) parts.push(itemSearchNames(member))
    } else {
      parts.push(itemSearchNames(slot.id))
    }
  }
  return parts.join(' ').toLowerCase()
}

function toEntry(id: string, recipe: VanillaRecipeJson, custom = false): CatalogEntry {
  const parsed = parseRecipe(recipe)
  if (!parsed.ok) return { id, raw: recipe, kind: null, custom, title: '', searchText: id.toLowerCase() }
  const { recipe: parsedRecipe } = parsed
  const title = recipeTitle(parsedRecipe)
  return {
    id,
    raw: recipe,
    kind: parsedRecipe.kind,
    custom,
    title,
    searchText: buildSearchText(id, parsedRecipe),
  }
}

/** 启动时全量解析一次，得到分区/标题/搜索文本；失败的条目仍保留（卡片内展示错误态） */
const catalog: CatalogEntry[] = [
  ...CUSTOM_RECIPES.map(({ id, recipe }) => toEntry(id, recipe, true)),
  ...VANILLA_RECIPES.map(({ id, recipe }) => toEntry(id, recipe)),
].sort((a, b) => {
  const orderA = a.custom ? -1 : a.kind === null ? Number.MAX_SAFE_INTEGER : KIND_ORDER[a.kind]
  const orderB = b.custom ? -1 : b.kind === null ? Number.MAX_SAFE_INTEGER : KIND_ORDER[b.kind]
  return orderA - orderB || a.id.localeCompare(b.id)
})

const query = ref('')
const kindFilter = ref<CatalogCategory>('all')

/* ------- 收藏（cookie 持久化） ------- */

const FAVORITES_COOKIE = 'rc_favorites'

/** 从 cookie 读取收藏 id 列表；无 cookie 或内容损坏返回空数组 */
function readFavoriteIds(): string[] {
  const prefix = `${FAVORITES_COOKIE}=`
  const raw = document.cookie
    .split('; ')
    .find((row) => row.startsWith(prefix))
    ?.slice(prefix.length)
  if (!raw) return []
  try {
    const list = JSON.parse(decodeURIComponent(raw))
    return Array.isArray(list) ? list.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

function writeFavoriteIds(ids: string[]) {
  // 有效期一年；SameSite=Lax 满足纯本地浏览
  document.cookie = `${FAVORITES_COOKIE}=${encodeURIComponent(JSON.stringify(ids))}; max-age=31536000; path=/; SameSite=Lax`
}

const favoriteIds = ref<string[]>(readFavoriteIds())
const favoriteSet = computed(() => new Set(favoriteIds.value))

function toggleFavorite(id: string) {
  const next = favoriteIds.value.includes(id)
    ? favoriteIds.value.filter((value) => value !== id)
    : [...favoriteIds.value, id]
  favoriteIds.value = next
  writeFavoriteIds(next)
}

/** 清空收藏：两步确认，3 秒内未再次点击则复原 */
const confirmClear = ref(false)
let confirmTimer: ReturnType<typeof setTimeout> | undefined
function clearFavorites() {
  if (!confirmClear.value) {
    confirmClear.value = true
    confirmTimer = setTimeout(() => (confirmClear.value = false), 3000)
    return
  }
  clearTimeout(confirmTimer)
  confirmClear.value = false
  favoriteIds.value = []
  writeFavoriteIds([])
}

const kindCounts = computed(() => {
  const counts: Record<string, number> = { all: catalog.length, favorites: 0 }
  for (const entry of catalog) {
    if (entry.custom) counts.custom = (counts.custom ?? 0) + 1
    else if (entry.kind) counts[entry.kind] = (counts[entry.kind] ?? 0) + 1
    if (favoriteSet.value.has(entry.id)) counts.favorites = (counts.favorites ?? 0) + 1
  }
  return counts
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return catalog.filter((entry) => {
    if (kindFilter.value === 'custom') return !!entry.custom
    if (kindFilter.value === 'favorites') return favoriteSet.value.has(entry.id)
    if (kindFilter.value !== 'all' && entry.kind !== kindFilter.value) return false
    return !q || entry.searchText.includes(q)
  })
})

/** 增量渲染：2042 张卡片一次性挂载会明显卡顿，滚动到页尾按批追加 */
const PAGE_SIZE = 60
const visibleCount = ref(PAGE_SIZE)
watch([query, kindFilter], () => {
  visibleCount.value = PAGE_SIZE
})
const visible = computed(() => filtered.value.slice(0, visibleCount.value))

const sentinel = ref<HTMLElement | null>(null)
let scrollObserver: IntersectionObserver | undefined
onMounted(() => {
  scrollObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        visibleCount.value = Math.min(visibleCount.value + PAGE_SIZE, filtered.value.length)
      }
    },
    { rootMargin: '600px' },
  )
  if (sentinel.value) scrollObserver.observe(sentinel.value)
})
onBeforeUnmount(() => {
  scrollObserver?.disconnect()
  clearTimeout(confirmTimer)
})
</script>

<template>
  <main class="demo">
    <h1 class="page-title">服务器合成表</h1>
    <section class="gallery">
      <div class="catalog-toolbar">
        <input
          v-model="query"
          class="catalog-search"
          type="search"
          placeholder="搜索配方 id 或产物名（如 pickaxe、钻石剑）"
        />
        <div class="kind-chips">
          <template v-for="opt in KIND_LABELS" :key="opt.kind">
            <button
              :class="{ active: kindFilter === opt.kind, custom: opt.kind === 'custom', favorites: opt.kind === 'favorites' }"
              @click="kindFilter = opt.kind"
            >
              {{ opt.label }}（{{ kindCounts[opt.kind] ?? 0 }}）
            </button>
            <button
              v-if="opt.kind === 'favorites' && favoriteIds.length"
              class="catalog-clear"
              :class="{ confirm: confirmClear }"
              type="button"
              @click="clearFavorites"
            >
              {{ confirmClear ? '再点一次确认清空' : '清空收藏' }}
            </button>
          </template>
        </div>
      </div>
      <p class="catalog-meta">显示 {{ visible.length }} / {{ filtered.length }} 个配方</p>
      <div class="catalog-grid">
        <RecipeCard
          v-for="entry in visible"
          :key="entry.id"
          :recipe="entry.raw"
          :favorite="favoriteSet.has(entry.id)"
          :badge="entry.custom ? '服务器自定义' : undefined"
          @toggle-favorite="toggleFavorite(entry.id)"
        />
      </div>
      <p v-if="kindFilter === 'favorites' && filtered.length === 0" class="catalog-meta">
        还没有收藏配方，点击卡片右上角的旗帜按钮即可收藏
      </p>
      <div ref="sentinel" class="catalog-sentinel" aria-hidden="true"></div>
      <p v-if="visible.length < filtered.length" class="catalog-meta">继续滚动加载更多…</p>
    </section>
  </main>
</template>

<style scoped>
.demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px 64px;
  display: flex;
  flex-direction: column;
}

.kind-chips button {
  padding: 7px 12px;
  font-size: 13px;
  color: #fff;
  text-shadow: 1px 1px 0 #3f3f3f;
  background: #6f6b66;
  border: 2px solid #000;
  box-shadow:
    inset 2px 2px 0 rgba(255, 255, 255, 0.35),
    inset -2px -2px 0 rgba(0, 0, 0, 0.35);
  cursor: pointer;
}

.kind-chips button:not(.custom):not(.favorites):not(.catalog-clear):hover {
  background: #7d7f92;
}

.kind-chips button:not(.custom):not(.favorites):not(.catalog-clear).active {
  background: #5a7fb0;
}

/* 自定义配方分类：各状态均为 Minecraft 品牌绿 */
.kind-chips button.custom {
  background: #3c8527;
}

.kind-chips button.custom:hover {
  background: #4a9a31;
}

.kind-chips button.custom.active {
  background: #4a9a31;
}

/* 已收藏分类：MC 金色黄底，深色文字保证可读 */
.kind-chips button.favorites {
  background: #ffaa00;
  color: #3f2c00;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.25);
}

.kind-chips button.favorites:hover {
  background: #ffc02e;
}

.kind-chips button.favorites.active {
  background: #e09b00;
}

/* 清空收藏：红色警示按钮，确认时加深（双类提升特异性，避免被 .kind-chips button 覆盖） */
.kind-chips .catalog-clear {
  padding: 7px 12px;
  font-size: 13px;
  color: #fff;
  text-shadow: 1px 1px 0 #3f3f3f;
  background: #a33b3b;
  border: 2px solid #000;
  box-shadow:
    inset 2px 2px 0 rgba(255, 255, 255, 0.35),
    inset -2px -2px 0 rgba(0, 0, 0, 0.35);
  cursor: pointer;
}

.kind-chips .catalog-clear:hover {
  background: #b34848;
}

.kind-chips .catalog-clear.confirm {
  background: #7e2626;
}

/* 页面标题：常规正文字体，居中 */
.page-title {
  margin: 0;
  text-align: center;
  font-size: 2rem;
  line-height: 1.25;
  font-weight: 700;
  color: var(--rc-foreground);
}

/* 配方目录网格（最小 320px 列、16px 间距、响应式列数） */
.gallery {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.catalog-toolbar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.catalog-search {
  /* 上下大号 margin，撑开标题与筛选区 */
  margin: 40px 0;
  width: 100%;
  max-width: 720px;
  padding: 14px 20px;
  font-size: 16px;
  color: var(--rc-foreground);
  background: var(--rc-card);
  border: 1px solid var(--rc-border);
  border-radius: 4px;
  outline: none;
}

.catalog-search:focus {
  border-color: var(--rc-primary);
}

.kind-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.catalog-meta {
  margin: 0;
  font-size: 12px;
  color: color-mix(in oklab, var(--rc-foreground) 62%, transparent);
}

/* 增量渲染哨兵：提前 600px 触发加载，不占视觉空间 */
.catalog-sentinel {
  height: 1px;
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
</style>
