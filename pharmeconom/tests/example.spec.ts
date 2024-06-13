import { test, expect, Page, APIRequestContext } from "@playwright/test";
import { Product } from "./domain";

test("Проверка api AddToBasket", async ({ page }) => {
  //переходим на главную
  await page.goto("https://www.pharmeconom.ru/");

  //получаем продукты, видимые на странице
  const products = await parseProducts(page);
  expect(
    products.length,
    "Количество Специальных предложений на главной странице больше 0"
  ).toBeGreaterThan(0);
  console.log(products);
  
  const firstProduct = products[0];
  //добавляем первый продукт в корзину
  await addToBasket(page.request, firstProduct);

  //переходим в корзину
  await page.goto("https://www.pharmeconom.ru/personal/cart/");
 

  //получаем продукты, находящиеся в корзине
  const basketProducts = await parseBasketProducts(page)
  expect(
    basketProducts.length,
    "В Корзине находится 1 продукт"
  ).toBe(1);
  expect(
    basketProducts[0].productId,
    "В Корзине находится тот продукт, что и был добавлен"
  ).toBe(firstProduct.productId);
});

test("Проверка иконки корзины", async ({ page }) => {
  // TODO
});

/**
 * Получить все Карточки "Специальных предложений"
 * @param page страница, на которой произвести поиск
 * @returns найденные продукты
 */
async function parseProducts(page: Page): Promise<Product[]> {
  //https://playwright.dev/docs/locators
  const result: Product[] = [];
  for (const prodcut of await page
    .locator("div.bx_catalog_item_container")
    .all()) {
    const manufactureInput = await prodcut.locator(
      "div.price_controls_wrapp > div > div > input[type=hidden]"
    );
    const manufactureId = await manufactureInput.inputValue();

    const buyButton = await prodcut.locator("a.buy-button").first();
    const productId = await buyButton.getAttribute("data-id");

    const nameHolderLink = await prodcut.locator(
      "div.bx_catalog_item_title > a"
    );
    const name = await nameHolderLink.textContent();

    if (
      manufactureId != undefined &&
      productId != undefined &&
      (await buyButton.isVisible()) &&
      name != undefined &&
      (await nameHolderLink.isVisible())
    ) {
      result.push({ name, productId, manufactureId });
    }
  }
  return result;
}

/**
 * Добавить продукт в корзину
 * @param request
 * @param product
 */
async function addToBasket(
  request: APIRequestContext,
  product: Product
): Promise<void> {
  const url = `https://www.pharmeconom.ru/?action=ADD2BASKET&id=${product.productId}&ajax_basket=Y&prop%5BCML2_MANUFACTURER%5D=${product.manufactureId}`
  const addResponse = await request.get(url, {});
  await expect(addResponse.ok()).toBeTruthy();
}


/**
 * Получить Продукты, добавленные в Корзину
 * @param page страница, на которой произвести поиск
 * @returns найденные продукты
 */
async function parseBasketProducts(page: Page): Promise<Product[]> {
  
  const result: Product[] = [];
  for (const prodcut of await page
    .locator("#basket_items_list > div > table > tbody > tr")
    .all()) {
    
    const productId = await prodcut.getAttribute("data-idprod");    

    const nameHolderLink = await prodcut.locator(
      "td.item > h2 > a"
    );
    const name = await nameHolderLink.textContent();

    if (
      productId != undefined  &&
      name != undefined
    ) {
      result.push({ name: name.trim(), productId });
    }
  }
  return result;
}