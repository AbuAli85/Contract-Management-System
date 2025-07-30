# 🚀 Performance Testing Guide

## Overview

This guide helps you test the performance improvements implemented in the Contract Management System.

## 🧪 **1. Test Performance: Run the App and Verify Improvements**

### **Step 1: Start Development Server**

```bash
pnpm run dev
```

### **Step 2: Open Browser Developer Tools**

1. Open Chrome/Firefox DevTools (F12)
2. Go to **Performance** tab
3. Go to **Network** tab
4. Go to **Lighthouse** tab

### **Step 3: Test Initial Load Performance**

1. **Clear browser cache** and reload page
2. **Record performance** in Performance tab
3. **Check load times** in Network tab
4. **Run Lighthouse audit** for Core Web Vitals

### **Step 4: Test React.memo() Optimizations**

1. Navigate to **Contracts** page
2. **Open React DevTools** (if available)
3. **Monitor re-renders** - should see fewer re-renders
4. **Check component render times** in Performance tab

### **Expected Improvements:**

- ✅ **30-50% faster renders** for contract tables
- ✅ **Reduced component re-renders**
- ✅ **Smoother interactions**

## 📦 **2. Monitor Bundle Size: Check Dynamic Imports**

### **Step 1: Build Production Bundle**

```bash
pnpm run build
```

### **Step 2: Analyze Bundle Size**

```bash
# Install bundle analyzer (if not already installed)
pnpm add -D @next/bundle-analyzer

# Add to next.config.js:
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

# Run analysis
ANALYZE=true pnpm run build
```

### **Step 3: Check Dynamic Import Loading**

1. **Open Network tab** in DevTools
2. **Navigate between pages** (Dashboard → Contracts → Analytics)
3. **Watch for chunk loading** - should see separate chunks
4. **Verify lazy loading** - components load on demand

### **Expected Improvements:**

- ✅ **40-60% smaller initial bundle**
- ✅ **Separate chunks** for heavy components
- ✅ **Faster initial page load**

## 🎯 **3. Test Virtual Scrolling: Large Datasets**

### **Step 1: Generate Test Data**

```javascript
// In browser console, generate test contracts:
const generateTestContracts = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `contract-${i}`,
    contract_number: `CON-${String(i).padStart(6, "0")}`,
    first_party_name_en: `Client ${i}`,
    second_party_name_en: `Employer ${i}`,
    promoter_name_en: `Promoter ${i}`,
    job_title: `Job Title ${i}`,
    contract_start_date: new Date().toISOString(),
    contract_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    contract_value: Math.floor(Math.random() * 100000) + 10000,
    status: ["active", "draft", "expired"][Math.floor(Math.random() * 3)],
  }))
}

// Generate 1000 test contracts
window.testContracts = generateTestContracts(1000)
```

### **Step 2: Test Virtual Scrolling Performance**

1. **Navigate to Contracts page**
2. **Replace data** with large dataset (if possible)
3. **Scroll through list** - should be smooth
4. **Check memory usage** in Performance tab
5. **Monitor frame rate** - should stay at 60fps

### **Step 3: Compare Performance**

1. **Test with regular table** (if available)
2. **Test with virtual scrolling table**
3. **Compare scroll smoothness**
4. **Check memory consumption**

### **Expected Improvements:**

- ✅ **90%+ faster rendering** with large lists
- ✅ **Smooth 60fps scrolling**
- ✅ **Constant memory usage** regardless of list size
- ✅ **Only visible items rendered**

## 📊 **4. Performance Monitoring Tools**

### **React Performance Profiler**

```javascript
// Add to your main component
import { Profiler } from "react"

function onRenderCallback(id, phase, actualDuration) {
  console.log(`Component ${id} took ${actualDuration}ms to ${phase}`)
}

;<Profiler id="App" onRender={onRenderCallback}>
  <YourApp />
</Profiler>
```

### **Bundle Size Monitoring**

```bash
# Install webpack-bundle-analyzer
pnpm add -D webpack-bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

module.exports = withBundleAnalyzer({
  // your existing config
});
```

### **Performance Metrics**

```javascript
// Add to your app for monitoring
const measurePerformance = () => {
  // First Contentful Paint
  const fcp = performance.getEntriesByName("first-contentful-paint")[0]
  console.log("FCP:", fcp.startTime)

  // Largest Contentful Paint
  const lcp = performance.getEntriesByName("largest-contentful-paint")[0]
  console.log("LCP:", lcp.startTime)

  // Time to Interactive
  const tti = performance.getEntriesByName("time-to-interactive")[0]
  console.log("TTI:", tti.startTime)
}

// Call after page load
window.addEventListener("load", measurePerformance)
```

## 🎯 **5. Success Criteria**

### **Performance Targets:**

- ✅ **Initial Load**: < 3 seconds
- ✅ **Time to Interactive**: < 5 seconds
- ✅ **Scroll Performance**: 60fps
- ✅ **Bundle Size**: < 2MB initial
- ✅ **Memory Usage**: < 100MB for large lists

### **User Experience:**

- ✅ **Smooth navigation** between pages
- ✅ **Responsive interactions** (buttons, forms)
- ✅ **Fast search and filtering**
- ✅ **No loading spinners** for common actions

## 🔧 **6. Troubleshooting**

### **If Performance is Poor:**

1. **Check Network tab** for slow requests
2. **Monitor Console** for errors
3. **Verify React.memo()** is working
4. **Check bundle size** with analyzer
5. **Test on different devices**

### **Common Issues:**

- **Large bundle**: Check for unused imports
- **Slow renders**: Verify memoization
- **Memory leaks**: Check for proper cleanup
- **Network issues**: Optimize API calls

## 📈 **7. Continuous Monitoring**

### **Set up monitoring:**

1. **Core Web Vitals** tracking
2. **Bundle size** alerts
3. **Performance budgets**
4. **User experience metrics**

### **Regular testing:**

- **Weekly performance audits**
- **Bundle size monitoring**
- **User feedback collection**
- **Performance regression testing**

---

## 🎉 **Testing Checklist**

- [ ] Development server starts successfully
- [ ] Initial page load is fast (< 3s)
- [ ] React.memo() reduces re-renders
- [ ] Dynamic imports load on demand
- [ ] Virtual scrolling works smoothly
- [ ] Bundle size is reasonable (< 2MB)
- [ ] Memory usage stays constant
- [ ] All interactions are responsive
- [ ] No console errors
- [ ] Lighthouse score > 90

**Run through this checklist to verify all optimizations are working correctly!**
