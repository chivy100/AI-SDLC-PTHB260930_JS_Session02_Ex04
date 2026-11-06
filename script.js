
/*
 * Các thành phần nền đã có:
 * BASE_URL, ApiError, buildQuery(), messageForStatus(),
 * request(), getProduct()
 */


// 1. HÀM THÊM SẢN PHẨM

async function addProduct(data) {
  // Kiểm tra dữ liệu sản phẩm trước khi gọi API.
  validateProduct(data);

  // Gửi yêu cầu POST để thêm sản phẩm.
  const result = await request("/products/add", {
    method: "POST",
    body: data
  });

  // Trả về sản phẩm do máy chủ phản hồi.
  return result;
}


// 2. HÀM CẬP NHẬT MỘT PHẦN SẢN PHẨM

async function updateProduct(id, changes) {
  // Kiểm tra mã sản phẩm.
  validatePositiveId(id);

  // Kiểm tra changes phải là object có ít nhất một thuộc tính.
  if (
    changes === null ||
    typeof changes !== "object" ||
    Array.isArray(changes) ||
    Object.keys(changes).length === 0
  ) {
    throw new ApiError(
      400,
      "Không có thay đổi nào để cập nhật.",
      null
    );
  }

  // Gửi PATCH với những thuộc tính cần thay đổi.
  const result = await request(`/products/${id}`, {
    method: "PATCH",
    body: changes
  });

  // Trả về sản phẩm sau cập nhật.
  return result;
}


// 3. HÀM THAY THẾ TOÀN BỘ SẢN PHẨM

async function replaceProduct(id, product) {
  // Kiểm tra mã sản phẩm.
  validatePositiveId(id);

  // Kiểm tra dữ liệu sản phẩm giống hàm addProduct().
  validateProduct(product);

  // Gửi PUT với toàn bộ dữ liệu sản phẩm.
  const result = await request(`/products/${id}`, {
    method: "PUT",
    body: product
  });

  // Trả về sản phẩm sau khi thay thế.
  return result;
}


// 4. HÀM XÓA SẢN PHẨM

async function deleteProduct(id) {
  // Kiểm tra mã sản phẩm.
  validatePositiveId(id);

  // Gửi DELETE để xóa sản phẩm, không gửi body.
  const result = await request(`/products/${id}`, {
    method: "DELETE"
  });

  // Chỉ xác nhận đã xóa khi máy chủ trả isDeleted = true.
  return {
    id: result.id,
    deleted: result.isDeleted === true
  };
}


// 5. HÀM TẠO GIỎ HÀNG

async function createCart(userId, items) {
  // Kiểm tra mã người dùng.
  validatePositiveId(userId);

  // Kiểm tra danh sách sản phẩm trong giỏ.
  validateCartItems(items);

  // Chuyển productId thành id theo cấu trúc API yêu cầu.
  const products = items.map((item) => ({
    id: item.productId,
    quantity: item.quantity
  }));

  // Gửi POST để tạo giỏ hàng.
  const result = await request("/carts/add", {
    method: "POST",
    body: {
      userId,
      products
    }
  });

  // Trả về giỏ hàng do máy chủ phản hồi.
  return result;
}


// 6. HÀM CẬP NHẬT SẢN PHẨM TRONG GIỎ HÀNG

async function updateCartItems(cartId, items) {
  // Kiểm tra mã giỏ hàng.
  validatePositiveId(cartId);

  // Kiểm tra danh sách sản phẩm trong giỏ.
  validateCartItems(items);

  // Chuyển productId thành id theo cấu trúc API yêu cầu.
  const products = items.map((item) => ({
    id: item.productId,
    quantity: item.quantity
  }));

  // Gửi PUT với merge = true để kết hợp sản phẩm trong giỏ.
  const result = await request(`/carts/${cartId}`, {
    method: "PUT",
    body: {
      merge: true,
      products
    }
  });

  // Trả về giỏ hàng sau cập nhật.
  return result;
}


// 7. HÀM THÊM SẢN PHẨM VÀ KIỂM TRA LƯU TRỮ

async function addProductAndVerify(data) {
  // Thêm sản phẩm và nhận dữ liệu máy chủ phản hồi.
  const created = await addProduct(data);

  try {
    // Gọi GET để kiểm tra sản phẩm có được lưu thật hay không.
    await getProduct(created.id);

    // Nếu GET thành công thì sản phẩm đã được lưu.
    return {
      created,
      persisted: true
    };
  } catch (error) {
    // Chỉ xem là chưa lưu nếu bước GET trả lỗi ApiError 404.
    if (error.name === "ApiError" && error.status === 404) {
      return {
        created,
        persisted: false
      };
    }

    // Các lỗi khác phải được ném tiếp.
    throw error;
  }
}


// 8. TEST CASE: addProduct()

// Lưu ý: Các test thủ công bên dưới được comment để không
// chạy chen vào bộ kiểm thử tests.html khi tải script.js.

/*
console.log("===== TEST addProduct() =====");

// Kiểm tra thêm sản phẩm hợp lệ.
addProduct({ title: "Tai nghe Rikkei", price: 25.5 })
  .then((data) => console.log(data));
// Expected: Sản phẩm do máy chủ trả về.

// Kiểm tra giá bằng 0 vẫn hợp lệ.
addProduct({ title: "Sản phẩm miễn phí", price: 0 })
  .then((data) => console.log(data));
// Expected: Sản phẩm do máy chủ trả về.

// Kiểm tra thiếu title.
addProduct({ price: 25.5 })
  .catch((error) => console.log(error.name, error.status, error.message));
// Expected: ApiError 400 "Dữ liệu sản phẩm không hợp lệ: cần title và price."

// Kiểm tra giá âm.
addProduct({ title: "Tai nghe", price: -10 })
  .catch((error) => console.log(error.name, error.status, error.message));
// Expected: ApiError 400 "Dữ liệu sản phẩm không hợp lệ: cần title và price."


// 9. TEST CASE: updateProduct()

console.log("===== TEST updateProduct() =====");

// Kiểm tra cập nhật một phần sản phẩm.
updateProduct(1, { price: 4500000 })
  .then((data) => console.log(data));
// Expected: Sản phẩm sau cập nhật.

// Kiểm tra ID không hợp lệ.
updateProduct(0, { price: 4500000 })
  .catch((error) => console.log(error.name, error.status, error.message));
// Expected: ApiError 400 "Mã sản phẩm không hợp lệ."

// Kiểm tra changes rỗng.
updateProduct(1, {})
  .catch((error) => console.log(error.name, error.status, error.message));
// Expected: ApiError 400 "Không có thay đổi nào để cập nhật."


// 10. TEST CASE: replaceProduct()

console.log("===== TEST replaceProduct() =====");

// Kiểm tra thay thế toàn bộ sản phẩm.
replaceProduct(1, {
  title: "Laptop Rikkei",
  price: 25000000
}).then((data) => console.log(data));
// Expected: Sản phẩm sau khi thay thế.

// Kiểm tra sản phẩm không có title.
replaceProduct(1, { price: 25000000 })
  .catch((error) => console.log(error.name, error.status, error.message));
// Expected: ApiError 400 "Dữ liệu sản phẩm không hợp lệ: cần title và price."


// 11. TEST CASE: deleteProduct()

console.log("===== TEST deleteProduct() =====");

// Kiểm tra xóa sản phẩm hợp lệ.
deleteProduct(4).then((data) => console.log(data));
// Expected: { id: 4, deleted: true }

// Kiểm tra ID không hợp lệ.
deleteProduct(-1)
  .catch((error) => console.log(error.name, error.status, error.message));
// Expected: ApiError 400 "Mã sản phẩm không hợp lệ."


// 12. TEST CASE: createCart()

console.log("===== TEST createCart() =====");

// Kiểm tra tạo giỏ hàng hợp lệ.
createCart(1, [
  { productId: 1, quantity: 2 },
  { productId: 2, quantity: 1 }
]).then((data) => console.log(data));
// Expected: Giỏ hàng do máy chủ trả về.

// Kiểm tra giỏ hàng rỗng.
createCart(1, [])
  .catch((error) => console.log(error.name, error.status, error.message));
// Expected: ApiError 400 "Giỏ hàng trống: cần ít nhất một sản phẩm."

// Kiểm tra quantity thập phân.
createCart(1, [
  { productId: 1, quantity: 1.5 }
]).catch((error) => console.log(error.name, error.status, error.message));
// Expected: ApiError 400 "Số lượng phải là số nguyên dương."


// 13. TEST CASE: updateCartItems()

console.log("===== TEST updateCartItems() =====");

// Kiểm tra cập nhật sản phẩm trong giỏ hàng.
updateCartItems(1, [
  { productId: 1, quantity: 3 }
]).then((data) => console.log(data));
// Expected: Giỏ hàng sau cập nhật.

// Kiểm tra cartId không hợp lệ.
updateCartItems(0, [
  { productId: 1, quantity: 2 }
]).catch((error) => console.log(error.name, error.status, error.message));
// Expected: ApiError 400 "Mã sản phẩm không hợp lệ."


// 14. TEST CASE: addProductAndVerify()

console.log("===== TEST addProductAndVerify() =====");

// Kiểm tra thêm sản phẩm và xác minh khả năng lưu trữ.
addProductAndVerify({
  title: "Tai nghe Rikkei",
  price: 25.5
}).then((result) => console.log(result));
// Expected: { created: sản phẩm máy chủ trả về, persisted: false }
*/


// 15. CÁC HÀM PHỤ TRỢ
// Đặt cuối file để tái sử dụng logic kiểm tra dữ liệu.


// 15.1. HÀM KIỂM TRA SẢN PHẨM

function validateProduct(data) {
  // Kiểm tra data phải là object hợp lệ.
  if (
    data === null ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    throw new ApiError(
      400,
      "Dữ liệu sản phẩm không hợp lệ: cần title và price.",
      null
    );
  }

  // Kiểm tra title phải là chuỗi không rỗng.
  const isValidTitle =
    typeof data.title === "string" &&
    data.title.trim() !== "";

  // Kiểm tra price phải là số hữu hạn và không âm.
  const isValidPrice =
    typeof data.price === "number" &&
    Number.isFinite(data.price) &&
    data.price >= 0;

  // Nếu title hoặc price không hợp lệ thì ném lỗi 400.
  if (!isValidTitle || !isValidPrice) {
    throw new ApiError(
      400,
      "Dữ liệu sản phẩm không hợp lệ: cần title và price.",
      null
    );
  }
}


// 15.2. HÀM KIỂM TRA ID SỐ NGUYÊN DƯƠNG

function validatePositiveId(id) {
  // ID phải là number, số nguyên và lớn hơn 0.
  if (
    typeof id !== "number" ||
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new ApiError(
      400,
      "Mã sản phẩm không hợp lệ.",
      null
    );
  }
}


// 15.3. HÀM KIỂM TRA DANH SÁCH SẢN PHẨM TRONG GIỎ

function validateCartItems(items) {
  // Kiểm tra items phải là mảng và có ít nhất một phần tử.
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(
      400,
      "Giỏ hàng trống: cần ít nhất một sản phẩm.",
      null
    );
  }

  // Kiểm tra từng sản phẩm trong danh sách.
  for (const item of items) {
    // Kiểm tra item phải là object hợp lệ.
    if (
      item === null ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {
      throw new ApiError(
        400,
        "Mã sản phẩm không hợp lệ.",
        null
      );
    }

    // Kiểm tra productId là số nguyên dương.
    if (
      typeof item.productId !== "number" ||
      !Number.isInteger(item.productId) ||
      item.productId <= 0
    ) {
      throw new ApiError(
        400,
        "Mã sản phẩm không hợp lệ.",
        null
      );
    }

    // Kiểm tra quantity là số nguyên dương.
    if (
      typeof item.quantity !== "number" ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new ApiError(
        400,
        "Số lượng phải là số nguyên dương.",
        null
      );
    }
  }
}
