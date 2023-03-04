// powered by https://github.com/zenn-dev/zenn-editor/blob/10fef04c83fb238b8fcdf7260acc8725666bf258/packages/zenn-embed-elements/src/utils/load-script.ts

const containerClassName = 'embed-tweet-container';
const fallbackLinkClassName = 'embed-tweet-link';

class TwitterCard extends HTMLElement {
  url;
  tweetId;

  constructor() {
    super();
    const url = this.getAttribute('href');
    if (!url) return;
    this.url = url;
    const match = url.match(/https?:\/\/twitter.com\/(.*?)\/status\/(.*?)\/?$/);
    if (match && match[2]) {
      this.tweetId = match[2];
    }
  }

  async connectedCallback() {
    this.render();
    this.embedTweet();
  }

  render() {
    this.innerHTML = `<div class="${containerClassName}">
      <a href="${this.url}" class="${fallbackLinkClassName}" rel="nofollow">${this.url}</a>
    </div>`;
  }

  async embedTweet() {
    const tweetId = this.tweetId;
    if (!(this.url && tweetId)) {
      console.log(`Invalid tweet URL:${this.url}`);
      return;
    }

    if (!window.twttr?.ready) {
      await loadScript({
        src: 'https://platform.twitter.com/widgets.js',
        id: 'twitter-widgets',
      });
    }

    const container = this.querySelector(`.${containerClassName}`);
    window.twttr?.widgets
      ?.createTweet(this.tweetId, container, {
        align: 'center',
      })
      .then(() => {
        /**
         * createTweetではJSONPを使っている（？）ためか、catch でエラーハンドリングができない
         * => fallback用のリンクをはじめから表示しておき、埋め込みが成功したら削除する
         */
        this.querySelector(`.${fallbackLinkClassName}`)?.remove();
      });
  }
}


function loadScript({ src, id }) {
  const identicalScript = id ? document.getElementById(id) : null;
  return new Promise((resolve, reject) => {
    if (identicalScript) {
      resolve();
    }
    const script = document.createElement('script');
    script.setAttribute('src', src);
    document.head.appendChild(script);
    script.onload = () => {
      if (id) script.setAttribute('id', id);
      resolve();
    };
    script.onerror = (e) => reject(e);
  });
}

customElements.define("twitter-card", TwitterCard)