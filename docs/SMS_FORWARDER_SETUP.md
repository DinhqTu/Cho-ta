# Hướng dẫn cấu hình SMS Forwarder

## Bước 1: Cài đặt App

Tải app **SMS Forwarder** từ Google Play Store:

- [SMS Forwarder - Auto forward SMS](https://play.google.com/store/apps/details?id=com.frfrfr.smsforwarder)

Hoặc các app tương tự:

- SMS to URL Forwarder
- Automate (nâng cao hơn)

## Bước 2: Cấp quyền cho App

1. Mở app SMS Forwarder
2. Cấp các quyền:
   - **Đọc SMS** - để đọc tin nhắn MoMo
   - **Nhận SMS** - để nhận tin nhắn mới
   - **Chạy nền** - để app hoạt động liên tục

## Bước 3: Tạo Rule Forward SMS

### Cấu hình Filter (Lọc SMS)

1. Nhấn **"Add Rule"** hoặc **"+"**
2. Cấu hình filter:
   - **Sender contains**: `MoMo` hoặc `MOMO` hoặc `9029`
   - **Message contains**: `nhan` (để chỉ forward SMS nhận tiền)

### Cấu hình Action (Forward đến Webhook)

1. Chọn **Action Type**: `Webhook` hoặc `HTTP Request`
2. Cấu hình:

```
URL: https://your-domain.com/api/sms-webhook
Method: POST
Content-Type: application/json
```

### Headers:

```
Authorization: Bearer your-secret-key-change-this
```

### Body Template (JSON):

```json
{
  "from": "%from%",
  "text": "%text%",
  "receivedStamp": "%receivedStamp%",
  "sim": "%sim%",
  "secret": "your-secret-key-change-this"
}
```

> **Lưu ý**: Thay `your-secret-key-change-this` bằng secret key bạn đặt trong file `.env`

## Bước 4: Test Webhook

### Test từ Terminal/Postman:

```bash
curl -X POST https://your-domain.com/api/sms-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key-change-this" \
  -d '{
    "from": "MoMo",
    "text": "Ban vua nhan 50,000d tu 0987654321. ND: BCM1234ABCD1234 TEN USER. SD: 1,500,000d"
  }'
```

### Test GET endpoint:

```bash
curl -H "Authorization: Bearer your-secret-key-change-this" \
  https://your-domain.com/api/sms-webhook
```

Response mong đợi:

```json
{
  "status": "ok",
  "message": "SMS Webhook is running"
}
```

## Bước 5: Cấu hình Appwrite

Tạo collection `pending_payments` trong Appwrite Console với schema:

| Attribute   | Type     | Required | Notes                     |
| ----------- | -------- | -------- | ------------------------- |
| paymentCode | string   | Yes      | Unique, indexed           |
| userId      | string   | Yes      |                           |
| userName    | string   | Yes      |                           |
| userEmail   | string   | No       |                           |
| amount      | integer  | Yes      | Số tiền (đồng)            |
| orderIds    | string[] | No       | Array of order IDs        |
| date        | string   | Yes      | YYYY-MM-DD                |
| status      | string   | Yes      | pending/completed/expired |
| createdAt   | string   | Yes      | ISO datetime              |
| paidAt      | string   | No       | ISO datetime              |
| paidAmount  | integer  | No       |                           |
| expiresAt   | string   | Yes      | ISO datetime              |

### Indexes cần tạo:

1. `paymentCode` - Unique
2. `userId` + `status` - Key
3. `status` + `createdAt` - Key

## Bước 6: Deploy và Test

1. Deploy app lên server (Vercel, Railway, etc.)
2. Update URL trong SMS Forwarder
3. Gửi test SMS hoặc nhờ ai đó chuyển tiền MoMo với nội dung có mã BCMxxxx
4. Kiểm tra logs để xác nhận webhook nhận được SMS

## Troubleshooting

### SMS không được forward:

- Kiểm tra app có chạy nền không
- Kiểm tra filter có đúng không
- Thử tắt Battery Optimization cho app

### Webhook không nhận được:

- Kiểm tra URL có đúng không
- Kiểm tra secret key có khớp không
- Xem logs trên server

### Payment không được verify:

- Kiểm tra format mã thanh toán BCMxxxx
- Kiểm tra số tiền có khớp không
- Xem logs parse SMS

## Flow hoạt động

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   MoMo      │────▶│ SMS Forwarder│────▶│  Webhook    │
│   SMS       │     │    App       │     │   API       │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Update    │◀────│   Match      │◀────│   Parse     │
│   Orders    │     │   Payment    │     │   SMS       │
└─────────────┘     └──────────────┘     └─────────────┘
```

## Bảo mật

1. **Luôn sử dụng HTTPS** cho webhook URL
2. **Đổi secret key** mặc định
3. **Không commit** secret key lên git
4. Cân nhắc thêm **IP whitelist** nếu cần
