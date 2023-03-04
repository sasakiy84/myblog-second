const styleText = `
.wrapper {
  border-top: 1px solid black;
  border-bottom: 1px solid black;
  margin: 20px 10px;
  box-sizing: border-box;
}

.img-wrapper {
  height: 100px;
  padding: 20px;
  width: 20%;
  flex-shrink: 0;
}
img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

a {
  display: flex;
  text-decoration: none;
  color: black;
}
p {
  margin: 0;
  line-height: 1.4;
  word-break: break-all;
}
.text-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;  
  padding-right: 20px;
}
.title {
  font-size: 17px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.description {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  margin-top: 10px;
}
`


class PreviewLink extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({mode: "open"})

    const style = document.createElement("style")
    style.innerText = styleText
    this.shadowRoot?.append(style)

    const wrapperLink = document.createElement("a")
    wrapperLink.href = this.getAttribute("href")
    wrapperLink.className = "wrapper"

    const title = this.getAttribute("title") || this.getAttribute("href")
    const description = this.getAttribute("description")
    const ogpURL = this.getAttribute("ogp-url")

    if (!!ogpURL) {
      const imgWrapper = document.createElement("div")
      imgWrapper.className = "img-wrapper"
      const img = document.createElement("img")
      img.setAttribute("src", ogpURL)
      imgWrapper.append(img)
      wrapperLink.append(imgWrapper)
    }

    const textWrapper = document.createElement("div")
    textWrapper.className = "text-wrapper"
    const titleTag = document.createElement("p")
    titleTag.className = "title"
    titleTag.innerText = title
    textWrapper.append(titleTag)

    if (!!description) {
      const descriptionTag = document.createElement("p")
      descriptionTag.innerText = description
      descriptionTag.className = "description"
      textWrapper.append(descriptionTag)
    }

    wrapperLink.append(textWrapper)

    this.shadowRoot?.append(wrapperLink)
  }
}

customElements.define("a-card", PreviewLink)