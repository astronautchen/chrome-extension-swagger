import { getActiveTabURL } from './utils.js';
console.log('This is a popup!');
const addNewBookmark = (bookmarks, bookmark) => {
  const bookmarkTitleElement = document.createElement('div');
  const { name, path, type, pathParameter, method, inter, suffix } = bookmark;
  bookmarkTitleElement.innerHTML = 
  `
<pre class="language-javascript"><code>
  export const ${name} = (${
    pathParameter ? pathParameter.replaceAll('integer', 'number') : ''
  }${pathParameter && type ? ',' : ''}${type ? 'data:' + type : ''}) => {
    return axios.${method}(${'`' + path + (suffix ? '?' + suffix : '') + '`'}${
    type ? ',data' : ''
  })
  }</code></pre>
  <div class="title">------ interface -------</div>
  <pre class="language-typescript"><code>${inter}</code></pre>
  `;
  bookmarks.appendChild(bookmarkTitleElement);
  Prism.highlightAll();
};

const viewBookmarks = (currentBookmarks = null) => {
  const bookmarksElement = document.getElementById('bookmarks');
  bookmarksElement.innerHTML = '';

  if (currentBookmarks) {
    addNewBookmark(bookmarksElement, currentBookmarks);
  } else {
    bookmarksElement.innerHTML = '<i class="row">No infomation to show</i>';
  }

  return;
};

document.addEventListener('DOMContentLoaded', async () => {
  const activeTab = await getActiveTabURL();

  if (activeTab.url.includes('/api/')) {
    chrome.storage.sync.get('path', (data) => {
      console.log(data);
      const currentVideoBookmarks = data.path || null;
      viewBookmarks(currentVideoBookmarks);
    });
  } else {
    const container = document.getElementsByClassName('container')[0];

    container.innerHTML = '<div class="title">This is not a api page.</div>';
  }
});