import { computed, onScopeDispose, ref, toValue, type MaybeRefOrGetter } from 'vue'

// 全局共享节拍：所有 tag 槽位按同一节奏同步轮播（参考 JEI / destruc7i0n crafting 的做法）
const tick = ref(0)
let intervalId: ReturnType<typeof setInterval> | undefined
let subscriberCount = 0

function subscribe() {
  subscriberCount++
  if (intervalId === undefined) {
    intervalId = setInterval(() => {
      tick.value++
    }, 1000)
  }
  onScopeDispose(() => {
    subscriberCount--
    if (subscriberCount === 0 && intervalId !== undefined) {
      clearInterval(intervalId)
      intervalId = undefined
    }
  })
}

/**
 * tag 成员轮播索引：成员数 > 1 时每秒推进一次（tick % 成员数），否则恒为 0。
 * 组件卸载后自动释放共享定时器。
 */
export function useTagCycleIndex(itemCount: MaybeRefOrGetter<number>) {
  subscribe()
  return computed(() => {
    const count = toValue(itemCount)
    return count > 1 ? tick.value % count : 0
  })
}
