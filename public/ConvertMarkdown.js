import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

export default class ConvertMarkdown extends HTMLElement {

    static observedAttributes = ['markdown']

    _formattedMarkdown = ''

    constructor() {
        super()
        this._formattedMarkdown = marked(this.getAttribute('markdown'))
       
        const shadow = this.attachShadow({ mode: 'open' })
        const div = document.createElement('div')
		shadow.appendChild(div)
        div.innerHTML = `${this._formattedMarkdown}`
    }



    attributeChangedCallback(name, oldVal, newVal) {
        this._formattedMarkdown = marked(newVal)
    }

}


