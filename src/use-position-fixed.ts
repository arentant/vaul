import React from 'react';
import { isIOS } from './use-prevent-scroll';

let previousBodyPosition = null;

export function usePositionFixed({ isOpen, isFullyClosed }: { isOpen: boolean; isFullyClosed: boolean }) {
  const scrollPos = React.useRef(0);

  function setPositionFixed() {
    // If previousBodyPosition is already set, don't set it again.
    if (previousBodyPosition === null) {
      previousBodyPosition = {
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
      };

      // Update the dom inside an animation frame
      const { scrollY, scrollX, innerHeight } = window;

      document.body.style.setProperty('position', 'fixed', 'important');
      document.body.style.top = `${-scrollPos.current}px`;
      document.body.style.left = `${-scrollX}px`;
      document.body.style.right = '0px';

      setTimeout(
        () =>
          requestAnimationFrame(() => {
            // Attempt to check if the bottom bar appeared due to the position change
            const bottomBarHeight = innerHeight - window.innerHeight;
            if (bottomBarHeight && scrollY >= innerHeight) {
              // Move the content further up so that the bottom bar doesn't hide it
              document.body.style.top = `${-(scrollPos.current + bottomBarHeight)}px`;
            }
          }),
        300,
      );
    }
  }

  function restorePositionSetting() {
    if (previousBodyPosition !== null) {
      // Convert the position from "px" to Int
      const y = -parseInt(document.body.style.top, 10);
      const x = -parseInt(document.body.style.left, 10);

      // Restore styles
      document.body.style.position = previousBodyPosition.position;
      document.body.style.top = previousBodyPosition.top;
      document.body.style.left = previousBodyPosition.left;
      document.body.style.right = 'unset';

      requestAnimationFrame(() => {
        window.scrollTo(x, y);
      });

      previousBodyPosition = null;
    }
  }

  React.useEffect(() => {
    function onScroll() {
      scrollPos.current = window.scrollY;
    }

    window.addEventListener('scroll', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  React.useEffect(() => {
    if (!isIOS()) return;
    // This is needed to force Safari toolbar to show **before** the drawer starts animating to prevent a gnarly shift from happenning
    if (isOpen) {
      setPositionFixed();
    } else if (isFullyClosed) {
      restorePositionSetting();
    }
  }, [isOpen, isFullyClosed]);
}
