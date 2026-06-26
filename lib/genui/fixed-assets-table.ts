import { markTotalRow } from "@/lib/genui/table-utils"
import type { TableCardData } from "@/lib/genui/types"

export const FIXED_ASSETS_TABLE: TableCardData = {
  columns: [
    { key: "account", label: "Account", align: "left", format: "text" },
    { key: "originalCost", label: "Original Cost", align: "left", format: "currency" },
    { key: "accumDepr", label: "Accum. Depr.", align: "left", format: "accounting" },
    { key: "nbv", label: "NBV", align: "left", format: "currency" },
  ],
  rows: [
    {
      account: "Computer, Softwares & Accessories",
      originalCost: 45804.55,
      accumDepr: -1173.3,
      nbv: 44631.25,
    },
    {
      account: "Truck",
      originalCost: 34005.89,
      accumDepr: -17255.84,
      nbv: 16750.05,
    },
    markTotalRow({
      account: "Total Fixed Assets",
      originalCost: 79810.44,
      accumDepr: -18429.14,
      nbv: 61381.3,
    }),
  ],
}
