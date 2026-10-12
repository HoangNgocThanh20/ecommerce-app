# Product Business Specification

## 1. Mục tiêu

Xây dựng module **Product** cho hệ thống E-commerce.

Product là sản phẩm được bán trong hệ thống và thuộc về một Category.

Product giúp người dùng:

- Xem danh sách sản phẩm.
- Xem chi tiết sản phẩm.
- Tìm kiếm sản phẩm.
- Lọc sản phẩm theo category.
- Sắp xếp sản phẩm.
- Phân trang danh sách sản phẩm.

Admin sẽ có quyền tạo, cập nhật và xóa product.

> **Current phase:** Project mới có JWT Authentication + AuthGuard, chưa triển khai Role/Permission Guard. Vì vậy phần authorization Admin sẽ được hoàn thiện ở phase sau.

---

# 2. Business Model

Quan hệ:

```text
Category 1 ───────── N Product
```

Một category có thể có nhiều product.

Một product chỉ thuộc một category.

Ví dụ:

```text
Electronics
 ├── iPhone 17
 ├── MacBook Pro
 └── AirPods Pro

Clothing
 ├── T-Shirt
 ├── Jeans
 └── Jacket
```

Product có thể có thêm các entity liên quan trong các module sau:

```text
Product
 ├── ProductImage
 ├── CartItem
 ├── OrderItem
 └── Review
```

---

# 3. Product Entity

Product gồm:

| Field        | Type     | Required | Rule           |
| ------------ | -------- | -------: | -------------- |
| id           | UUID     |      Yes | Primary key    |
| name         | String   |      Yes | Product name   |
| slug         | String   |      Yes | Unique         |
| description  | String   |       No | Optional       |
| price        | Decimal  |      Yes | >= 0           |
| stock        | Int      |      Yes | >= 0           |
| quantitySold | Int      |      Yes | Default 0      |
| categoryId   | UUID     |      Yes | Foreign key    |
| createdAt    | DateTime |      Yes | Auto generated |
| updatedAt    | DateTime |      Yes | Auto updated   |

## Business rules

### Name

- Không được empty.
- Nên trim whitespace.
- Giới hạn độ dài hợp lý.
- Không nhất thiết phải unique.

Ví dụ:

```text
iPhone 17
```

Có thể tồn tại nhiều product có tên tương tự nếu business sau này cho phép.

---

### Slug

Slug dùng cho URL thân thiện:

```text
iphone-17
macbook-pro-m4
adidas-football-shirt
```

Slug phải unique.

Ví dụ:

```http
GET /products/iphone-17
```

Client có thể gửi slug khi tạo product hoặc backend tự generate từ name.

Ở phase hiện tại có thể chọn:

```text
name
 ↓
generate slug
 ↓
iphone-17
```

---

### Description

Description không bắt buộc.

Ví dụ:

```text
Apple iPhone 17 with 256GB storage.
```

Có thể để `null`.

---

### Price

Price:

- Required.
- Phải >= 0.
- Không cho phép giá âm.

Ví dụ:

```text
15000000
```

Không hợp lệ:

```text
-100000
```

---

### Stock

Stock biểu thị số lượng sản phẩm hiện còn trong kho.

```text
stock >= 0
```

Ví dụ:

```text
stock = 100
```

Khi khách hàng mua sản phẩm, stock sẽ được giảm ở Order/Inventory flow sau này.

---

### Quantity Sold

`quantitySold` biểu thị tổng số lượng sản phẩm đã bán.

Khi tạo product:

```text
quantitySold = 0
```

Client **không được tự set `quantitySold`**.

Sau này khi Order hoàn tất:

```text
Order completed
       ↓
OrderItem
       ↓
Product.quantitySold += quantity
```

---

### Category

Mỗi product bắt buộc thuộc một category.

```text
Product
   │
   └── categoryId
           ↓
       Category
```

Khi tạo hoặc update product với `categoryId`, backend phải kiểm tra category có tồn tại hay không.

Nếu category không tồn tại:

```http
404 Not Found
```

---

# 4. Permission

## Current Phase

Hiện tại project mới có:

```text
JWT
 ↓
AuthGuard
```

Chưa có:

```text
Role Guard
Permission Guard
```

Vì vậy Product API hiện tại chỉ cần tập trung vào:

```text
Authentication
Business Logic
CRUD
Validation
```

---

## Public/User

Có thể cho phép:

```text
GET /products
GET /products/:id
```

---

## Authenticated User

Ở phase hiện tại, nếu Product API yêu cầu đăng nhập:

```text
JWT
 ↓
AuthGuard
 ↓
Product Controller
```

---

## Future Admin

Khi implement Role/Permission:

```text
POST   /products       → ADMIN
PATCH  /products/:id  → ADMIN
DELETE /products/:id  → ADMIN
```

Flow tương lai:

```text
Request
   ↓
JWT Authentication
   ↓
AuthGuard
   ↓
Permission / Role Guard
   ↓
Product Controller
   ↓
Product Service
   ↓
Prisma
   ↓
PostgreSQL
```

---

# 5. API Specification

## 5.1 Create Product

```http
POST /products
```

### Permission

Current phase:

```text
Authenticated
```

Future:

```text
ADMIN
```

### Request

```json
{
  "name": "iPhone 17",
  "description": "Latest Apple iPhone",
  "price": 25000000,
  "stock": 100,
  "categoryId": "category-uuid"
}
```

Client không cần gửi:

```text
id
quantitySold
createdAt
updatedAt
```

Backend tự xử lý các field này.

---

### Business flow

```text
Create Product
      ↓
Validate request
      ↓
Check Category exists
      ↓
Generate / validate slug
      ↓
Create Product
      ↓
quantitySold = 0
```

---

### Success

```http
201 Created
```

Response:

```json
{
  "id": "uuid",
  "name": "iPhone 17",
  "slug": "iphone-17",
  "description": "Latest Apple iPhone",
  "price": 25000000,
  "stock": 100,
  "quantitySold": 0,
  "categoryId": "category-uuid",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### Validation

Nếu:

```json
{
  "name": "",
  "price": -100,
  "stock": -10
}
```

→

```http
400 Bad Request
```

Nếu category không tồn tại:

```http
404 Not Found
```

Nếu slug đã tồn tại:

```http
409 Conflict
```

---

# 5.2 Get Products

```http
GET /products
```

### Permission

Public.

### Query parameters

Hỗ trợ:

```text
page
limit
search
categoryId
sortBy
sortOrder
```

Ví dụ:

```http
GET /products?page=1&limit=10
```

Search:

```http
GET /products?search=iphone
```

Filter:

```http
GET /products?categoryId=category-uuid
```

Sort:

```http
GET /products?sortBy=price&sortOrder=asc
```

Có thể kết hợp:

```http
GET /products?page=1&limit=10&search=iphone&categoryId=category-uuid&sortBy=price&sortOrder=asc
```

---

### Search

Search theo product name.

Ví dụ:

```text
search = iphone
```

Có thể trả về:

```text
iPhone 13
iPhone 14
iPhone 17
```

---

### Filter

Filter theo category:

```text
categoryId
```

Ví dụ:

```http
GET /products?categoryId=electronics-id
```

Chỉ trả về product thuộc category đó.

---

### Sorting

Các field được phép sort:

```text
name
price
stock
quantitySold
createdAt
updatedAt
```

Ví dụ:

```http
GET /products?sortBy=price&sortOrder=asc
```

Không cho client truyền arbitrary database field.

---

### Pagination

Ví dụ:

```http
GET /products?page=1&limit=10
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "iPhone 17",
      "slug": "iphone-17",
      "price": 25000000,
      "stock": 100,
      "quantitySold": 10,
      "categoryId": "category-uuid"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

# 5.3 Get Product Detail

```http
GET /products/:id
```

### Permission

Public.

### Response

```json
{
  "id": "uuid",
  "name": "iPhone 17",
  "slug": "iphone-17",
  "description": "Latest Apple iPhone",
  "price": 25000000,
  "stock": 100,
  "quantitySold": 10,
  "categoryId": "category-uuid",
  "createdAt": "...",
  "updatedAt": "..."
}
```

Nếu product không tồn tại:

```http
404 Not Found
```

---

# 5.4 Update Product

```http
PATCH /products/:id
```

### Permission

Current phase:

```text
Authenticated
```

Future:

```text
ADMIN
```

### Request

Ví dụ:

```json
{
  "name": "iPhone 17 Pro"
}
```

Hoặc:

```json
{
  "price": 28000000,
  "stock": 80
}
```

Các field đều optional.

---

### Business rules

Không được update:

```text
id
quantitySold
createdAt
updatedAt
```

`quantitySold` được business logic của Order quản lý.

Nếu update `categoryId`:

```text
Check category exists
        ↓
Category tồn tại
        ↓
Cho phép update
```

Nếu category không tồn tại:

```http
404 Not Found
```

Nếu update slug thành slug đã tồn tại:

```http
409 Conflict
```

---

# 5.5 Delete Product

```http
DELETE /products/:id
```

### Permission

Current phase:

```text
Authenticated
```

Future:

```text
ADMIN
```

Backend kiểm tra product tồn tại trước khi delete.

Nếu product không tồn tại:

```http
404 Not Found
```

---

## Business consideration

Product sau này có thể được reference bởi:

```text
CartItem
OrderItem
Review
ProductImage
```

Vì vậy việc delete Product cần được xử lý cẩn thận khi các module này được implement.

Ví dụ:

```text
Product
 ├── CartItem
 ├── OrderItem
 ├── Review
 └── ProductImage
```

Ở phase Product hiện tại, chưa cần giải quyết toàn bộ các dependency này nếu các module trên chưa tồn tại.

---

# 6. Error Cases

Module cần xử lý tối thiểu:

### Product không tồn tại

```http
404 Not Found
```

### Category không tồn tại

```http
404 Not Found
```

### Slug bị duplicate

```http
409 Conflict
```

### Request invalid

```http
400 Bad Request
```

### Chưa đăng nhập khi endpoint yêu cầu authentication

```http
401 Unauthorized
```

### User không có quyền

Future:

```http
403 Forbidden
```

---

# 7. Database Relationship

Prisma model cần thể hiện:

```text
Category
   │
   │ 1
   │
   │ N
   ▼
Product
```

Product:

```text
products
----------------
id
name
slug
description
price
stock
quantity_sold
category_id
created_at
updated_at
```

Category:

```text
categories
----------------
id
name
slug
description
created_at
updated_at
```

Relation:

```text
products.category_id
        │
        ▼
categories.id
```

`category_id` là foreign key.

---

# 8. Service Responsibilities

`ProductService` chịu trách nhiệm business logic.

Các method chính:

```text
create()
findAll()
findOne()
update()
remove()
```

Business logic nằm ở Service.

Ví dụ:

```text
ProductController
       ↓
create(dto)
       ↓
ProductService
       ├── validate category
       ├── validate slug
       ├── generate slug
       └── Prisma create
```

Controller không nên trực tiếp xử lý database.

---

# 9. Controller Responsibilities

Controller chỉ nên chịu trách nhiệm:

```text
HTTP request
     ↓
DTO validation
     ↓
call Service
     ↓
HTTP response
```

Không nên viết business logic dài trong Controller.

Không nên:

```text
ProductController
 ├── check category
 ├── check slug
 ├── query product
 ├── update database
 └── xử lý business
```

Nên:

```text
ProductController
       ↓
ProductService
       ↓
PrismaService
```

---

# 10. DTO

Tạo tối thiểu:

```text
CreateProductDto
UpdateProductDto
QueryProductDto
```

## CreateProductDto

```text
name
description?
price
stock
categoryId
```

Nếu backend tự generate slug:

```text
slug
```

không cần client gửi.

---

## UpdateProductDto

```text
name?
description?
price?
stock?
categoryId?
```

Không bao gồm:

```text
id
quantitySold
createdAt
updatedAt
```

---

## QueryProductDto

```text
page?
limit?
search?
categoryId?
sortBy?
sortOrder?
```

---

# 11. Suggested Module Structure

```text
src/
└── modules/
    └── product/
        ├── product.module.ts
        ├── product.controller.ts
        ├── product.service.ts
        ├── dto/
        │   ├── create-product.dto.ts
        │   ├── update-product.dto.ts
        │   └── query-product.dto.ts
        └── ...
```

Sau này có thể bổ sung:

```text
product.constants.ts
product.types.ts
```

nếu thực sự cần.

---

# 12. Implementation Order

Bạn nên implement theo thứ tự này:

### Step 1 — Prisma schema

Tạo:

```text
Product
```

và relation:

```text
Category 1 ─ N Product
```

---

### Step 2 — Migration

Tạo migration và kiểm tra database.

---

### Step 3 — Module

Tạo:

```text
ProductModule
ProductController
ProductService
```

---

### Step 4 — Create

Implement:

```http
POST /products
```

Học:

- DTO
- Validation
- Prisma create
- Foreign key
- Unique constraint
- Exception handling

---

### Step 5 — Read

Implement:

```http
GET /products
GET /products/:id
```

Sau đó thêm:

- Pagination
- Search
- Category filter
- Sorting

---

### Step 6 — Update

Implement:

```http
PATCH /products/:id
```

Học:

- Partial update
- Validation
- Category validation
- Slug validation
- Prisma update

---

### Step 7 — Delete

Implement:

```http
DELETE /products/:id
```

Kiểm tra các dependency của Product khi các module liên quan đã tồn tại.

---

### Step 8 — Authorization

Phase hiện tại:

```text
JWT + AuthGuard
```

Phase sau:

```text
JWT
 ↓
AuthGuard
 ↓
Role / Permission Guard
 ↓
ADMIN
```

---

# 13. Acceptance Criteria

Module Product được coi là hoàn thành khi:

- [ ] Có Product entity.
- [ ] Product thuộc một Category.
- [ ] Không tạo Product với Category không tồn tại.
- [ ] Product có name.
- [ ] Product có slug unique.
- [ ] Price không được âm.
- [ ] Stock không được âm.
- [ ] `quantitySold` mặc định bằng `0`.
- [ ] Client không được tự set `quantitySold`.
- [ ] User có thể lấy danh sách Product.
- [ ] Có pagination.
- [ ] Có search.
- [ ] Có filter theo category.
- [ ] Có sorting.
- [ ] User có thể xem Product detail.
- [ ] Có thể update Product.
- [ ] Có thể update category của Product nếu Category mới tồn tại.
- [ ] Không cho update `quantitySold` trực tiếp.
- [ ] Có thể delete Product.
- [ ] API trả đúng HTTP status code.
- [ ] Validation được xử lý bằng DTO.
- [ ] Business logic nằm trong Service.
- [ ] Database relation với Category hoạt động đúng.

---

# 14. Testing Scenarios

Bạn nên tự test các case sau:

```text
1. Create product thành công

2. Create product với name rỗng

3. Create product với price âm

4. Create product với stock âm

5. Create product với categoryId không tồn tại

6. Create product với slug duplicate

7. Get product list

8. Get product list với pagination

9. Search product

10. Filter product theo category

11. Sort product theo price

12. Sort product theo createdAt

13. Get product detail

14. Get product không tồn tại

15. Update product thành công

16. Update product không tồn tại

17. Update product với category không tồn tại

18. Update product với slug duplicate

19. Không cho update quantitySold trực tiếp

20. Delete product

21. Delete product không tồn tại
```

---

# 15. Mục tiêu học Backend từ module này

Product là module quan trọng hơn Category vì bắt đầu có nhiều business rule và relationship.

Flow cần nắm:

```text
HTTP
 ↓
Controller
 ↓
DTO / Validation
 ↓
Guard
 ↓
Service
 ↓
Business Rules
 ↓
Prisma
 ↓
PostgreSQL
```

Đồng thời hiểu relationship:

```text
Category
    │
    │ 1
    │
    │ N
    ▼
Product
    │
    ├── ProductImage
    ├── CartItem
    ├── OrderItem
    └── Review
```

Product sẽ là nền tảng cho các module business tiếp theo:

```text
Category
    ↓
Product
    ↓
ProductImage
    ↓
Cart
    ↓
Order
    ↓
Review
```

Ở Product phase hiện tại, **chỉ tập trung vào Product CRUD + search + filter + sort + pagination + relationship với Category**. Chưa cần kéo Cart, Order, Review vào implementation.
