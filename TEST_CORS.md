# Testing CORS Configuration

## Quick Test Commands

### 1. Test from command line (curl)
```bash
# Test from localhost origin
curl -i -X GET http://localhost:5000/api/stats \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json"

# Should return:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Credentials: true
```

### 2. Test from browser console
Open your browser console at `http://localhost:3000` and run:

```javascript
// Test GET request
fetch('http://localhost:5000/api/stats', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ CORS Success!');
  console.log('Status:', response.status);
  return response.json();
})
.then(data => console.log('Data:', data))
.catch(error => console.error('❌ CORS Error:', error));
```

### 3. Test with credentials
```javascript
fetch('http://localhost:5000/api/auth/me', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
})
.then(response => response.json())
.then(data => console.log('✅ Authenticated request successful:', data))
.catch(error => console.error('❌ Error:', error));
```

## Expected Results

### ✅ Success Cases (Should Work)

1. **From localhost:3000**
   ```
   Origin: http://localhost:3000
   Response: 200 OK
   Headers: Access-Control-Allow-Origin: http://localhost:3000
   ```

2. **From localhost:5173 (Vite)**
   ```
   Origin: http://localhost:5173
   Response: 200 OK
   Headers: Access-Control-Allow-Origin: http://localhost:5173
   ```

3. **From any localhost port**
   ```
   Origin: http://localhost:9999
   Response: 200 OK (in development mode)
   Headers: Access-Control-Allow-Origin: http://localhost:9999
   ```

4. **No Origin (Postman, mobile apps)**
   ```
   Origin: (none)
   Response: 200 OK
   ```

### ❌ Blocked Cases (Should Fail)

1. **Random domain in production**
   ```
   Origin: http://random-site.com
   Response: 403 Forbidden
   Error: "Not allowed by CORS policy"
   ```

## Development vs Production Behavior

### Development Mode (NODE_ENV=development)
- ✅ All localhost origins allowed
- ✅ All 127.0.0.1 origins allowed
- ✅ Dynamic port matching
- ✅ Production origins (for testing)

### Production Mode (NODE_ENV=production)
- ✅ Only whitelisted production origins
- ❌ Localhost blocked (unless explicitly added)
- ✅ Custom origins via CORS_ORIGINS env var

## Troubleshooting

### Issue: "No 'Access-Control-Allow-Origin' header"
**Solution:** Check that:
1. Your origin is in the whitelist
2. Server is running in development mode for localhost
3. Origin header is being sent correctly

### Issue: "Credentials not supported"
**Solution:** Ensure:
1. `credentials: 'include'` in fetch options
2. Server has `credentials: true` in CORS config (✅ already set)

### Issue: "CORS preflight failure"
**Solution:** 
1. Check that OPTIONS method is allowed (✅ already configured)
2. Verify preflight headers are correct
3. Check maxAge is set (✅ 24 hours configured)

## Environment Variables

Add custom origins to `.env`:
```bash
# Development
NODE_ENV=development
CORS_ORIGINS=http://localhost:9000,http://localhost:4000

# Production
NODE_ENV=production
CORS_ORIGINS=https://myapp.com,https://app.mysite.io
```

## Rate Limiting

CORS-aware rate limits:
- **Localhost**: 1000 requests / 15 minutes
- **GitHub Pages**: 100 requests / 15 minutes
- **Other origins**: 50 requests / 15 minutes

## Security Notes

✅ **Enabled:**
- Origin validation
- Credentials support
- Security headers (X-Frame-Options, CSP, etc.)
- Rate limiting per origin
- Request logging

❌ **Blocked:**
- Suspicious origin patterns (.onion, free domains)
- Unauthorized origins in production
- Excessive requests from single origin
