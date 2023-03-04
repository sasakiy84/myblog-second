class InlineCode extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    const code = document.createElement("code");
    code.append(document.createElement("slot"))
    const style = document.createElement("style");
    style.innerText = `
code {
  padding: 0.1em 0.4em;
  margin: 0 5px;
  font-size: 95%;
  white-space: break-spaces;
  background-color: rgba(175,184,193,0.2);
  border-radius: 3px;
  font-family: 'Noto Serif JP', serif;
}
    `;
    this.shadowRoot?.append(style, code);
  }
}
customElements.define("inline-code", InlineCode);
