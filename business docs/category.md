# Category Business Specification

## 1. Mục tiêu

Xây dựng module **Category** cho hệ thống E-commerce.

Category dùng để phân loại sản phẩm, giúp người dùng:

- Xem danh sách category.
- Xem các sản phẩm thuộc một category.
- Tìm kiếm/lọc sản phẩm theo category.

Admin có quyền tạo, cập nhật và xóa category.

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

---

# 3. Category Entity

Category gồm:

| Field       | Type     | Required | Rule           |
| ----------- | -------- | -------: | -------------- |
| id          | UUID     |      Yes | Primary key    |
| name        | String   |      Yes | Unique         |
| slug        | String   |      Yes | Unique         |
| description | String   |       No | Optional       |
| createdAt   | DateTime |      Yes | Auto generated |
| updatedAt   | DateTime |      Yes | Auto updated   |

### Business rules

#### Name

- Không được empty.
- Không được trùng.
- Nên trim whitespace.
- Ví dụ:

```text
"Electronics"
```

không được tồn tại 2 lần.

#### Slug

Slug dùng cho URL thân thiện:

```text
electronics
mobile-phones
laptops
```

Slug phải unique.

Ví dụ:

```http
GET /categories/electronics
```

---

# 4. Permission

Chỉ `ADMIN` được phép thay đổi Category.

### Public/User

Được:

```text
GET /categories
GET /categories/:id
```

### Admin

Được:

```text
POST   /categories
PATCH  /categories/:id
DELETE /categories/:id
```

Flow:

```text
Request
   ↓
JWT Authentication
   ↓
AuthGuard
   ↓
Permission / Role Guard
   ↓
Category Controller
   ↓
Category Service
   ↓
Prisma
   ↓
PostgreSQL
```

---

# 5. API Specification

## 5.1 Create Category

```http
POST /categories
```

### Permission

`ADMIN`

### Request

```json
{
  "name": "Electronics",
  "description": "Electronic devices and accessories"
}
```

Không yêu cầu client gửi `slug`.

Backend có thể tự generate:

```text
Electronics
     ↓
electronics
```

### Success

```http
201 Created
```

Response:

```json
{
  "id": "uuid",
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic devices and accessories",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Validation

Nếu:

```json
{
  "name": ""
}
```

→ `400 Bad Request`

Nếu category đã tồn tại:

```text
Electronics
```

→ `409 Conflict`

---

# 5.2 Get Categories

```http
GET /categories
```

### Permission

Public.

### Query parameters

Hỗ trợ:

```text
page
limit
search
sortBy
sortOrder
```

Ví dụ:

```http
GET /categories?page=1&limit=10
```

Hoặc:

```http
GET /categories?search=elect
```

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Electronic devices"
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

# 5.3 Get Category Detail

```http
GET /categories/:id
```

### Permission

Public.

### Response

```json
{
  "id": "uuid",
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic devices",
  "createdAt": "...",
  "updatedAt": "..."
}
```

Nếu không tồn tại:

```http
404 Not Found
```

---

# 5.4 Update Category

```http
PATCH /categories/:id
```

### Permission

`ADMIN`

### Request

```json
{
  "name": "Electronic Devices",
  "description": "Electronic devices and accessories"
}
```

Các field đều optional.

Ví dụ chỉ update description:

```json
{
  "description": "All electronic products"
}
```

### Business rules

Không được update thành một `name` đã tồn tại.

Ví dụ:

```text
Category A = Electronics
Category B = Clothing
```

Không được update Clothing thành:

```text
Electronics
```

→ `409 Conflict`

---

# 5.5 Delete Category

```http
DELETE /categories/:id
```

### Permission

`ADMIN`

Đây là phần cần xử lý business quan trọng.

Không được xóa category nếu vẫn còn product thuộc category đó.

Ví dụ:

```text
Electronics
 ├── iPhone
 ├── MacBook
 └── AirPods
```

Admin gọi:

```http
DELETE /categories/electronics-id
```

Backend phải reject.

```http
409 Conflict
```

Response có thể:

```json
{
  "message": "Cannot delete category because it contains products"
}
```

Admin phải chuyển/xóa các product trước.

---

# 6. Error Cases

Module cần xử lý tối thiểu:

### Category không tồn tại

```http
404 Not Found
```

### Category name bị duplicate

```http
409 Conflict
```

### Slug bị duplicate

```http
409 Conflict
```

### User không có quyền

```http
403 Forbidden
```

### Chưa đăng nhập khi endpoint yêu cầu authentication

```http
401 Unauthorized
```

### Request invalid

```http
400 Bad Request
```

### Xóa category đang có product

```http
409 Conflict
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

Category không tồn tại độc lập hoàn toàn vì Product sẽ reference tới Category.

Ví dụ database concept:

```text
categories
----------------
id
name
slug
description
created_at
updated_at


products
----------------
id
name
price
category_id  ────────> categories.id
...
```

`category_id` là foreign key.

---

# 8. Service Responsibilities

`CategoryService` chịu trách nhiệm business logic.

Các method chính:

```text
create()
findAll()
findOne()
update()
remove()
```

Nhưng quan trọng là:

> Controller chỉ nhận request và trả response. Business logic nằm ở Service.

Ví dụ:

```text
Controller
   ↓
create(dto)
   ↓
Service
   ├── validate business rule
   ├── check duplicate
   ├── generate slug
   └── Prisma create
```

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

Ví dụ không nên:

```text
Controller
 ├── check category exists
 ├── check duplicate
 ├── generate slug
 ├── query product
 └── update database
```

Nên:

```text
Controller
    ↓
CategoryService
    ↓
PrismaService
```

---

# 10. DTO

Tạo tối thiểu:

```text
CreateCategoryDto
UpdateCategoryDto
QueryCategoryDto
```

### CreateCategoryDto

```text
name
description?
```

### UpdateCategoryDto

```text
name?
description?
```

### QueryCategoryDto

```text
page?
limit?
search?
sortBy?
sortOrder?
```

Bạn cần sử dụng validation để đảm bảo input hợp lệ.

---

# 11. Suggested Module Structure

```text
src/
└── modules/
    └── category/
        ├── category.module.ts
        ├── category.controller.ts
        ├── category.service.ts
        ├── dto/
        │   ├── create-category.dto.ts
        │   ├── update-category.dto.ts
        │   └── query-category.dto.ts
        └── ...
```

Có thể thêm:

```text
category.constants.ts
category.types.ts
```

nếu sau này thực sự cần.

---

# 12. Implementation Order

Bạn nên implement theo thứ tự này:

### Step 1 — Prisma schema

Tạo:

```text
Category
```

và relation với `Product`.

---

### Step 2 — Migration

Tạo migration và kiểm tra database.

---

### Step 3 — Module

Tạo:

```text
CategoryModule
CategoryController
CategoryService
```

---

### Step 4 — Create

Implement:

```http
POST /categories
```

Học:

- DTO
- validation
- Prisma create
- unique constraint
- exception

---

### Step 5 — Read

Implement:

```http
GET /categories
GET /categories/:id
```

Sau đó thêm:

- pagination
- search
- sorting

---

### Step 6 — Update

Implement:

```http
PATCH /categories/:id
```

Học:

- partial update
- duplicate checking
- Prisma update

---

### Step 7 — Delete

Implement:

```http
DELETE /categories/:id
```

Đặc biệt xử lý:

```text
Category có Product
       ↓
Không cho delete
       ↓
409 Conflict
```

---

### Step 8 — Authorization

Đảm bảo:

```text
GET        → public
POST       → ADMIN
PATCH      → ADMIN
DELETE     → ADMIN
```

---

# 13. Acceptance Criteria

Module Category được coi là hoàn thành khi:

- [ ] Admin có thể tạo category.
- [ ] Không cho tạo category trùng name.
- [ ] Slug được generate và unique.
- [ ] User có thể lấy danh sách category.
- [ ] Có pagination.
- [ ] Có search.
- [ ] Có sorting.
- [ ] User có thể xem category detail.
- [ ] Admin có thể update category.
- [ ] Admin không thể update thành category đã tồn tại.
- [ ] Admin có thể delete category nếu category không có product.
- [ ] Không cho delete category đang có product.
- [ ] User không thể POST/PATCH/DELETE category.
- [ ] API trả đúng HTTP status code.
- [ ] Validation được xử lý bằng DTO.
- [ ] Business logic nằm trong Service.
- [ ] Database relation với Product hoạt động đúng.

---

# 14. Testing Scenarios

Bạn nên tự test các case sau:

```text
1. Create category thành công
2. Create category với name rỗng
3. Create category duplicate
4. Get category list
5. Get category với pagination
6. Search category
7. Get category không tồn tại
8. Update category thành công
9. Update category không tồn tại
10. Update thành duplicate name
11. Delete category không có product
12. Delete category đang có product
13. User cố POST category
14. User cố PATCH category
15. User cố DELETE category
```

---

# 15. Mục tiêu học Backend từ module này

Đừng coi Category chỉ là CRUD.

Qua module này bạn cần hiểu được flow:

```text
HTTP
 ↓
Controller
 ↓
DTO / Validation
 ↓
Guard / Authorization
 ↓
Service
 ↓
Business Rules
 ↓
Prisma
 ↓
PostgreSQL
```

Sau khi hoàn thành Category, module tiếp theo là **Product**. Product sẽ khó hơn đáng kể vì bắt đầu xuất hiện nhiều relationship và business rule:

```text
Category
    │
    └────── Product
              │
              ├── ProductImage
              ├── CartItem
              ├── OrderItem
              └── Review
```

Đây sẽ là module quan trọng nhất để bạn chuyển từ tư duy **Senior Frontend → Fullstack Backend**.
