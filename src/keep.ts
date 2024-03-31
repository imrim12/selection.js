import defu from 'defu'

import { getNativeSelection, getSelection } from './get'
import { setSelection, setSelectionNode } from './set'
import { isInputOrTextarea } from './utils'
import { isMouseInBound, watchMouseMovement } from './mouse'

export interface KeepSelectionOptions {
  withinBound?: HTMLElement | HTMLElement[]
  onBlur?: ((e: FocusEvent) => void)
}

/**
 * Keep the selection event when the element lose focused
 *
 */
export function keepSelection(element: HTMLElement, options?: KeepSelectionOptions) {
  const _options = defu(options, {})

  watchMouseMovement()

  function reselectElement(e: FocusEvent) {
    const currentSelection = getSelection(element)

    if (
      !currentSelection.text
      || (
        _options.withinBound
        && !isMouseInBound(element)
        && !(
          Array.isArray(_options.withinBound)
            ? _options.withinBound.some(isMouseInBound)
            : isMouseInBound(_options.withinBound)
        )
      )
    ) {
      _options.onBlur?.(e)

      return
    }

    if (isInputOrTextarea(element)) {
      setSelection(element, {
        start: currentSelection.start,
        end: currentSelection.end,
        noEffect: true,
      })
    }
    else {
      // contenteditable contains HTML tags, so it would be more complicated
      // there are cases where the selection is between 2 different nodes
      // therefore getting the native selection is necessary to have the
      // correct start and end nodes
      // For example:
      // Text: "<b>Hello</b> World"
      // If you select Hello World, you probably select the text node inside the <b> tag ("Hello")
      // and the text node outside the <b> tag (" World")
      // you must set the range position to the correct node in order for it to work correctly
      const currentNativeSelection = getNativeSelection()

      setSelectionNode({
        nativeSelection: currentNativeSelection,
        noEffect: true,
      })
    }
  }

  element.addEventListener('blur', reselectElement)

  function removeKeepListener() {
    element.removeEventListener('blur', reselectElement)
  }

  return {
    stop: removeKeepListener,
  }
}
