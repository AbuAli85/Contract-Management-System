"use client"

// DOM Safety Patch for React
// This utility patches React's DOM manipulation methods to be more resilient

let isPatched = false

export function patchReactDOM() {
  if (isPatched || typeof window === 'undefined') {
    return
  }

  console.log('🔧 Applying DOM safety patches...')

  // Patch Node.prototype.insertBefore
  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function<T extends Node>(newNode: T, referenceNode: Node | null): T {
    try {
      // Validate nodes before insertion
      if (!newNode || !this) {
        console.warn('Invalid nodes for insertBefore:', { newNode, parent: this })
        return newNode
      }

      // Check if reference node is still a child of this node
      if (referenceNode && !this.contains(referenceNode)) {
        console.warn('Reference node is not a child of parent, appending instead')
        return this.appendChild(newNode)
      }

      return originalInsertBefore.call(this, newNode, referenceNode) as T
    } catch (error) {
      console.warn('insertBefore failed, falling back to appendChild:', error)
      return this.appendChild(newNode) as T
    }
  }

  // Patch Node.prototype.removeChild
  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function<T extends Node>(child: T): T {
    try {
      // Validate nodes before removal
      if (!child || !this) {
        console.warn('Invalid nodes for removeChild:', { child, parent: this })
        return child
      }

      // Check if child is still a child of this node
      if (!this.contains(child)) {
        console.warn('Child node is not a child of parent, skipping removal')
        return child
      }

      return originalRemoveChild.call(this, child) as T
    } catch (error) {
      console.warn('removeChild failed:', error)
      return child
    }
  }

  // Patch Node.prototype.replaceChild
  const originalReplaceChild = Node.prototype.replaceChild
  Node.prototype.replaceChild = function<T extends Node>(newChild: Node, oldChild: T): T {
    try {
      // Validate nodes before replacement
      if (!newChild || !oldChild || !this) {
        console.warn('Invalid nodes for replaceChild:', { newChild, oldChild, parent: this })
        return oldChild
      }

      // Check if old child is still a child of this node
      if (!this.contains(oldChild)) {
        console.warn('Old child is not a child of parent, appending new child instead')
        this.appendChild(newChild)
        return oldChild
      }

      return originalReplaceChild.call(this, newChild, oldChild) as T
    } catch (error) {
      console.warn('replaceChild failed, falling back to appendChild:', error)
      this.appendChild(newChild)
      return oldChild
    }
  }

  // Patch Node.prototype.appendChild
  const originalAppendChild = Node.prototype.appendChild
  Node.prototype.appendChild = function<T extends Node>(child: T): T {
    try {
      // Validate nodes before appending
      if (!child || !this) {
        console.warn('Invalid nodes for appendChild:', { child, parent: this })
        return child
      }

      return originalAppendChild.call(this, child) as T
    } catch (error) {
      console.warn('appendChild failed:', error)
      return child
    }
  }

  // Patch React's internal DOM manipulation
  if (window.React) {
    const originalReactDOM = (window as any).ReactDOM
    if (originalReactDOM) {
      // Patch ReactDOM.render if it exists
      if (originalReactDOM.render) {
        const originalRender = originalReactDOM.render
        originalReactDOM.render = function(element: any, container: Element, callback?: () => void) {
          try {
            return originalRender.call(this, element, container, callback)
          } catch (error) {
            console.warn('ReactDOM.render failed, attempting recovery:', error)
            // Try to clear container and re-render
            try {
              container.innerHTML = ''
              return originalRender.call(this, element, container, callback)
            } catch (retryError) {
              console.error('ReactDOM.render recovery failed:', retryError)
              throw retryError
            }
          }
        }
      }
    }
  }

  isPatched = true
  console.log('✅ DOM safety patches applied')
}

// Auto-patch on module load
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchReactDOM)
  } else {
    patchReactDOM()
  }
} 