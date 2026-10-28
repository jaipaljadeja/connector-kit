import type { Demo } from "@useairfoil/connector-kit";

import type { Product } from "../resources/products/row";

import { gid } from "../resources/shared";
import {
  amount,
  catalog,
  day,
  handleOf,
  isGiftCard,
  productNumber,
  valuesOf,
  variantNumber,
  vendor,
} from "./shared";

/** The product catalog, written once before any customer. */
export const setupRows = ({ now }: Demo.DemoContext) => {
  const created = new Date(now.getTime() - 800 * day);

  const products: Array<Product> = catalog.map((item, p) => ({
    id: gid("Product", productNumber(p)),
    legacyResourceId: String(productNumber(p)),
    title: item.title,
    handle: handleOf(item),
    descriptionHtml: `<p>The ${item.title.toLowerCase()} from ${vendor}.</p>`,
    productType: item.type,
    vendor,
    status: "ACTIVE",
    tags: [item.type.toLowerCase()],
    createdAt: created,
    updatedAt: created,
    publishedAt: created,
    templateSuffix: "",
    featuredMedia: {
      image: { url: `https://demo.example.com/images/${handleOf(item)}.jpg`, altText: item.title },
    },
    options: [
      {
        id: gid("ProductOption", productNumber(p)),
        name: item.option?.name ?? "Title",
        position: 1,
        values: valuesOf(item),
      },
    ],
    variants: valuesOf(item).map((value, v) => ({
      id: gid("ProductVariant", variantNumber(p, v)),
      legacyResourceId: String(variantNumber(p, v)),
      title: value,
      sku: `NW-${handleOf(item).toUpperCase()}-${value.replace("/", "").toUpperCase()}`,
      barcode: null,
      price: amount(item.price),
      compareAtPrice: null,
      inventoryPolicy: "DENY",
      taxable: !isGiftCard(item),
      createdAt: created,
      updatedAt: created,
    })),
  }));

  return { products };
};
