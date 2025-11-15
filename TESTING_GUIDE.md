# Testing Guide - Eco-Nexus SCOS

Quick guide to test all features of the application.

## Prerequisites

1. Dependencies installed (`npm install` in both frontend and backend)
2. Environment variables set (at minimum `OPENROUTER_API_KEY` in backend)
3. Backend running on port 3001
4. Frontend running on port 3000

## Manual Testing Checklist

### 1. Backend API Tests

#### Health Check
```bash
curl http://localhost:3001/health
```
**Expected**: `{"status":"ok","message":"Eco-Nexus SCOS API is running"}`

#### List Vendors
```bash
curl http://localhost:3001/api/vendors/list
```
**Expected**: Array of 5 vendors with all properties

#### Get Single Vendor
```bash
curl http://localhost:3001/api/vendors/vendor-1
```
**Expected**: Single vendor object

#### Agent Info
```bash
curl http://localhost:3001/api/agents/info
```
**Expected**: Agent configuration with Buyer and Seller agents

#### Negotiation
```bash
curl -X POST http://localhost:3001/api/agents/negotiate \
  -H "Content-Type: application/json" \
  -d '{"goals": {"minimize_cost": 0.3, "minimize_carbon": 0.3, "minimize_delivery": 0.2, "maximize_sustainability": 0.2}}'
```
**Expected**: 
- `winner` object with vendor details
- `carbon_saved`, `cost_saved`, `scc_tokens` numbers
- `reasoning` string (Aristotelian reasoning)
- `comparison` array
- `negotiation_details` object

#### Analytics
```bash
curl http://localhost:3001/api/analytics/report
```
**Expected**: Analytics object (mock data if Snowflake not configured)

#### Solana Reward (Optional)
```bash
curl -X POST http://localhost:3001/api/solana/reward \
  -H "Content-Type: application/json" \
  -d '{"amount": 15.5}'
```
**Expected**: Transaction hash and success message

### 2. Frontend UI Tests

#### Marketplace Page (`/`)
- [ ] Page loads without errors
- [ ] Header displays correctly
- [ ] Vendor cards render (5 vendors)
- [ ] Each card shows: name, price, carbon, delivery, sustainability score
- [ ] Cards have hover effects
- [ ] "Compare & Negotiate" button is visible
- [ ] Navigation links work

#### Negotiation Flow
- [ ] Click "Compare & Negotiate"
- [ ] Loading state shows
- [ ] Redirects to `/results` page
- [ ] No console errors

#### Results Page (`/results`)
- [ ] Success banner displays
- [ ] Winner vendor shown with all details
- [ ] Savings displayed (cost + carbon)
- [ ] SCC tokens shown
- [ ] Reasoning text displayed
- [ ] Comparison table shows all vendors
- [ ] Navigation buttons work

#### Dashboard Page (`/dashboard`)
- [ ] Page loads
- [ ] Stats cards show metrics
- [ ] Charts render (line, bar, pie)
- [ ] No console errors
- [ ] Navigation works

### 3. Integration Tests

#### Full User Flow
1. [ ] Open marketplace
2. [ ] Browse vendors
3. [ ] Click "Compare & Negotiate"
4. [ ] Wait for negotiation (should complete in <5 seconds)
5. [ ] View results page
6. [ ] Check reasoning includes "Aristotelian reasoning framework"
7. [ ] Navigate to dashboard
8. [ ] Verify analytics display

#### Error Handling
- [ ] Backend down: Frontend shows error gracefully
- [ ] Invalid API response: No crashes
- [ ] Network error: User-friendly message

## Automated Testing (Optional)

### Backend API Test Script

Create `backend/test-api.js`:
```javascript
import axios from 'axios'

const API_URL = 'http://localhost:3001'

async function testAPI() {
  try {
    // Health check
    const health = await axios.get(`${API_URL}/health`)
    console.log('✅ Health check:', health.data.status)
    
    // Vendors
    const vendors = await axios.get(`${API_URL}/api/vendors/list`)
    console.log('✅ Vendors:', vendors.data.length, 'vendors')
    
    // Negotiation
    const negotiation = await axios.post(`${API_URL}/api/agents/negotiate`, {
      goals: {
        minimize_cost: 0.3,
        minimize_carbon: 0.3,
        minimize_delivery: 0.2,
        maximize_sustainability: 0.2
      }
    })
    console.log('✅ Negotiation:', negotiation.data.winner.name)
    
    // Analytics
    const analytics = await axios.get(`${API_URL}/api/analytics/report`)
    console.log('✅ Analytics:', analytics.data.decisions_count, 'decisions')
    
    console.log('\n🎉 All tests passed!')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testAPI()
```

Run with: `node backend/test-api.js`

## Common Issues & Solutions

### Issue: "Cannot connect to backend"
**Solution**: 
- Verify backend is running: `curl http://localhost:3001/health`
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Check CORS settings in backend

### Issue: "Negotiation fails"
**Solution**:
- Check OpenRouter API key is set
- Verify API key is valid
- Check network connection
- Review backend console logs

### Issue: "Vendors not loading"
**Solution**:
- Check `backend/data/vendors.json` exists
- Verify file permissions
- Check backend console for errors

### Issue: "Dashboard shows no data"
**Solution**:
- This is expected if Snowflake not configured
- App uses mock data automatically
- Check browser console for errors

## Performance Testing

### Response Times (Expected)
- Health check: <100ms
- List vendors: <200ms
- Negotiation: <3 seconds (with LLM)
- Analytics: <500ms (or instant with mock data)

### Load Testing (Optional)
```bash
# Install Apache Bench
# Test 100 requests
ab -n 100 -c 10 http://localhost:3001/health
```

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browser (responsive design)

## Security Checks

- [ ] No API keys exposed in frontend code
- [ ] Environment variables not committed
- [ ] CORS properly configured
- [ ] Input validation on API endpoints

## Final Verification

Before hackathon demo:
- [ ] All manual tests pass
- [ ] No console errors
- [ ] UI looks good on different screen sizes
- [ ] Demo flow works smoothly
- [ ] Backup plan ready (local demo)

---

**Quick Test Command:**
```bash
# Run all API tests
curl http://localhost:3001/health && \
curl http://localhost:3001/api/vendors/list | head -20 && \
curl -X POST http://localhost:3001/api/agents/negotiate \
  -H "Content-Type: application/json" \
  -d '{"goals": {"minimize_cost": 0.3, "minimize_carbon": 0.3, "minimize_delivery": 0.2, "maximize_sustainability": 0.2}}' | head -30
```

