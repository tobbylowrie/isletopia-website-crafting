/**
 * 合成台 GUI 贴图与槽位标定。
 * 贴图 crafting_bg_3x3.png（128x66）已包含 3x3 槽位格、箭头与产物槽，
 * 槽位坐标由资产标定给出。
 */

/** 背景贴图原始尺寸 */
export const BG_WIDTH = 128
export const BG_HEIGHT = 66

/** MC 物品贴图统一渲染尺寸（18px 间距 = 16px 物品 + 2px 间隙） */
export const ITEM_SIZE = 16

/** 3x3 网格第一格左上角与格间距 */
export const GRID_ORIGIN_X = 7
export const GRID_ORIGIN_Y = 7
export const GRID_PITCH = 18
export const GRID_COLS = 3
export const GRID_ROWS = 3

/** 产物槽左上角 */
export const RESULT_X = 100
export const RESULT_Y = 25

/** 网格第 row 行第 col 列槽位的贴图坐标（1x） */
export function gridSlotPos(row: number, col: number): { x: number; y: number } {
  return { x: GRID_ORIGIN_X + col * GRID_PITCH, y: GRID_ORIGIN_Y + row * GRID_PITCH }
}
