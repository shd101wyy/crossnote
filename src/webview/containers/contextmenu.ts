import { createContainer } from 'unstated-next';

/*
interface ContextMenuItem {
  name: string;
  callback: () => void;
  items: { [key: string]: ContextMenuItem };
}
*/

const ContextMenuContainer = createContainer(() => {
  return {};
});

export default ContextMenuContainer;
