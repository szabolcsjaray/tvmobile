const CONFIGTYPE_BOOLEAN = 0;
const CONFIGTYPE_INT = 1;
const CONFIGTYPE_STRING = 2;
const CONFIGTYPE_LIST = 3;

var inputId = 0;

function configClose(evt) {
    if (evt.target.configs == undefined || evt.target.configs == null) {
        return;
    }
    evt.target.configs.div.style.display = "none";
}

class Configs {
    constructor(configDiv) {
        this.items = [];
        this.div = configDiv;
    }

    addConfig(name, ctype, initValue, changeFunction, hidden, valueList) {
        let config = new ConfigItem(inputId, name, ctype, initValue, changeFunction, hidden, valueList);
        inputId++;
        this.items.push(config);
    }

    readConfig(name) {
        let config = this.items.find((configItem) => configItem.name == name);
        if (config != undefined) {
            return config.value;
        } else {
            return null;
        }
    }

    setConfig(name, value) {
        let config = this.items.find((configItem) => configItem.name == name);
        if (config != undefined) {
            return config.value;
        } else {
            return null;
        }
    }

    createConfigDivContent() {
        let innerHtmlStr = "Beállítások:<br><div class='configTable'>";
        for(let i = 0; i < this.items.length; i++) {
            let config = this.items[i];
            innerHtmlStr += config.createConfigHtml();
        }
        innerHtmlStr += "</div>"
        innerHtmlStr += "<button id='closeConfig"+this.id+"' class='configsClose'>Bezár</button>";

        this.div.innerHTML = innerHtmlStr;

        this.div.configs = this;

        el("closeConfig"+this.id).onclick = configClose;
        el("closeConfig"+this.id).configs = this;

        for(let i = 0; i < this.items.length; i++) {
            let config = this.items[i];
            let inputEl = el(config.htmlId);
            inputEl.configItem = config;
            inputEl.onchange = configItemChanged;
        }
    }
}