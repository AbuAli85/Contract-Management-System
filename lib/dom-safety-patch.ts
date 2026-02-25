'use client';

// DOM Safety Patch for React
// This utility patches React's DOM manipulation methods to be more resilient
// Only apply when explicitly called to avoid hydration issues

let isPatched = false;

export function patchReactDOM() {
  if (isPatched || typeof window === 'undefined') {
    return;
  }

  // Only patch in development and when explicitly needed
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Patch Node.prototype.insertBefore
  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(
    newNode: T,
    referenceNode: Node | null
  ): T {
    try {
      // Validate nodes before insertion
      if (!newNode || !this) {
        return newNode;
      }

      // Check if reference node is still a child of this node
      if (referenceNode && !this.contains(referenceNode)) {
        return this.appendChild(newNode);
      }

      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    } catch (error) {
      return this.appendChild(newNode) as T;
    }
  };

  // Patch Node.prototype.removeChild
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    try {
      // Validate nodes before removal
      if (!child || !this) {
        return child;
      }

      // Check if child is still a child of this node
      if (!this.contains(child)) {
        return child;
      }

      return originalRemoveChild.call(this, child) as T;
    } catch (error) {
      return child;
    }
  };

  // Patch Node.prototype.replaceChild
  const originalReplaceChild = Node.prototype.replaceChild;
  Node.prototype.replaceChild = function <T extends Node>(
    newChild: Node,
    oldChild: T
  ): T {
    try {
      // Validate nodes before replacement
      if (!newChild || !oldChild || !this) {
        return oldChild;
      }

      // Check if old child is still a child of this node
      if (!this.contains(oldChild)) {
        this.appendChild(newChild);
        return oldChild;
      }

      return originalReplaceChild.call(this, newChild, oldChild) as T;
    } catch (error) {
      this.appendChild(newChild);
      return oldChild;
    }
  };

  // Patch Node.prototype.appendChild
  const originalAppendChild = Node.prototype.appendChild;
  Node.prototype.appendChild = function <T extends Node>(child: T): T {
    try {
      // Validate nodes before appending
      if (!child || !this) {
        return child;
      }

      return originalAppendChild.call(this, child) as T;
    } catch (error) {
      return child;
    }
  };

  // Patch React's internal DOM manipulation
  if (window.React) {
    const originalReactDOM = (window as any).ReactDOM;
    if (originalReactDOM) {
      // Patch ReactDOM.render if it exists
      if (originalReactDOM.render) {
        const originalRender = originalReactDOM.render;
        originalReactDOM.render = function (
          element: any,
          container: Element,
          callback?: () => void
        ) {
          try {
            return originalRender.call(this, element, container, callback);
          } catch (error) {
            // Try to clear container and re-render
            try {
              container.innerHTML = '';
              return originalRender.call(this, element, container, callback);
            } catch (retryError) {
              throw retryError;
            }
          }
        };
      }
    }
  }

  isPatched = true;
}

// Remove automatic patching to avoid hydration issues
// The patch should only be applied when explicitly called
