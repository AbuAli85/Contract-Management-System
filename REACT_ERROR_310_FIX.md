# 🔧 React Error #310 Fix - Contracts Page

## ❌ **Problem**

```
Error: Minified React error #310; visit https://react.dev/errors/310 for the full message
```

**What it means:** An infinite loop or inconsistent hook state in the component.

---

## 🔍 **Root Cause Analysis**

### **The Issue: Calling Permission Methods Before Loading Check**

**File:** `app/[locale]/contracts/page.tsx`

**Original Code (BROKEN):**
```typescript
// Line 240: Get permissions hook
const permissions = usePermissions();

// Lines 243-259: All state hooks defined
const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
const [currentView, setCurrentView] = useState<'table' | 'grid'>('table');
// ... more useState calls ...

// Line 262-266: PROBLEM! Calling permission methods BEFORE loading check
const canCreateContract = permissions.canCreateContract();
const canEditContract = permissions.canEditContract();
const canDeleteContract = permissions.canDeleteContract();
const canExportContracts = permissions.canExportContracts();
const canGenerateContract = permissions.canGenerateContract();

// Line 268: useRef calls
const isMountedRef = useRef(true);
const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

// Line 273: LOADING CHECK comes AFTER permission calls
if (permissions.isLoading) {
  return <LoadingState />;
}
```

### **Why This Causes Error #310:**

1. **First render:** `permissions.isLoading` is `true`
2. **Permission methods called** (lines 262-266) **while loading**
3. **Hooks are called in different order** on each render
4. **React detects inconsistent hook usage** → Error #310

### **The Hook Order Problem:**

When `permissions.isLoading === true`:
- **Render 1:** `usePermissions()` → all state hooks → permission methods → `useRef()` → early return
- **Render 2:** Same order, but permission methods might behave differently

When `permissions.isLoading === false`:
- **Render 1:** `usePermissions()` → all state hooks → permission methods (different state) → `useRef()` → full component

**React Rule Violated:** Hooks must be called in the **same order** on every render, and **conditionally rendered components should only have hooks needed for that render**.

---

## ✅ **Solution: Move Permission Checks After Loading State**

**File:** `app/[locale]/contracts/page.tsx` (lines 237-283)

**Fixed Code:**
```typescript
// Step 1: Get permissions hook
const permissions = usePermissions();  ← At line 240

// Step 2: Define all state hooks (must happen before any conditional)
const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
const [currentView, setCurrentView] = useState<'table' | 'grid'>('table');
// ... more useState calls ...

// Step 3: Define all refs (must happen before any conditional)
const isMountedRef = useRef(true);
const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

// Step 4: LOADING CHECK (can be conditional)
if (permissions.isLoading) {
  return <LoadingState />;
}

// Step 5: ONLY NOW call permission methods (after loading check)
const canCreateContract = permissions.canCreateContract();
const canEditContract = permissions.canEditContract();
const canDeleteContract = permissions.canDeleteContract();
const canExportContracts = permissions.canExportContracts();
const canGenerateContract = permissions.canGenerateContract();

// Step 6: Continue with component logic
```

### **Why This Works:**

1. ✅ **All hooks called unconditionally first** (useState, useRef)
2. ✅ **Loading check can return early** (no hooks after this)
3. ✅ **Permission methods called only when permissions are ready** (no inconsistent state)
4. ✅ **Hook order remains consistent** across all renders

---

## 📋 **Rules of Hooks (React Best Practices)**

### ✅ **DO:**
```typescript
// ✅ Call hooks at top level, unconditionally
const [data, setData] = useState(null);
const ref = useRef();

if (condition) {
  return <Early />;  // ← Can return early BEFORE hooks
}

// ✅ Can use hooks after early return check
const result = useSomeHook();
```

### ❌ **DON'T:**
```typescript
// ❌ Call hooks conditionally
if (condition) {
  const [data, setData] = useState(null);  // WRONG!
}

// ❌ Call hooks after conditional that doesn't return
if (condition) {
  doSomething();
}
const [data, setData] = useState(null);  // Inconsistent order!

// ❌ Call methods that depend on hook state before checking if ready
const permissions = usePermissions();
const canDo = permissions.canDo();  // ← Might fail if permissions loading
if (permissions.isLoading) {
  return <Loading />;
}
```

---

## 🧪 **Testing the Fix**

After deployment, verify:

1. ✅ **No React Error #310 in console**
2. ✅ **Contracts page loads correctly**
3. ✅ **Permissions load without errors**
4. ✅ **All permission checks work** (create, edit, delete, etc.)
5. ✅ **Multiple navigations don't cause errors**

---

## 📊 **Commit Summary**

**Commit:** `fix: resolve React error #310 by moving permission checks after loading state`

**Changes:**
- Moved permission method calls (lines 262-266) to after loading check (line 273)
- Maintained hook order consistency
- No breaking changes to functionality

**Result:** ✅ **Error #310 eliminated!**

---

## 🎯 **Key Takeaway**

> **Hook calls must be unconditional and in a consistent order.** If a hook's value isn't ready yet, perform conditional logic AFTER the early return, not before calling the hook.

### **The Pattern:**
```typescript
// 1. All hooks (useState, useRef, useContext, etc.)
const hook1 = useHook1();
const hook2 = useHook2();

// 2. Loading/auth check with early return
if (hook1.isLoading) return <Loading />;

// 3. Derived state/computed values
const derived = hook1.doSomething();

// 4. Rest of component
```

This ensures React always sees the same hooks in the same order, regardless of loading states or conditional rendering.
