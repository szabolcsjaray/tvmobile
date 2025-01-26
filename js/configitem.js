function configItemChanged(evt) {
    let config = evt.target.configItem;
    if (config == undefined 
        ||  config == null ) {
            return;
    }
    console.log("new value for" + config.name + ":");
    if (config.ctype == CONFIGTYPE_BOOLEAN) {
        config.value = (el(config.htmlId).value == 0);
        config.changeFunction(config.value);
    } else if (config.ctype == CONFIGTYPE_LIST) {
        config.value = el(config.htmlId).value;
        config.changeFunction(config.valueList.indexOf(config.value));
    }
    console.log(config.value);
}


class ConfigItem {
    constructor(id, name, ctype, initValue, changeFunction, hidden, valueList) {
        this.id = id;
        this.name = name;
        this.ctype = ctype;
        this.value = initValue;
        this.changeFunction = changeFunction;
        this.hidden = hidden;
        this.valueList = valueList;
        this.htmlId = null; // later set
        if (this.ctype == CONFIGTYPE_LIST && this.initValue >= this.valueList.length ) {
            this.initValue = 0;
        }
    }

    makeList(valueList) {
        this.htmlId = "configSel" + this.id;
        let html = "<select id='"+this.htmlId+"' class='configSelect'>";
        for(let i = 0; i < valueList.length; i++) {
            html += "<option value='"+ valueList[i] 
                + "'"
                + (this.initValue == i ? " selected" : "") +">" + valueList[i] + "</option>";
        }
        html += "</select>";
        return html;
    }
    
    inputField() {
        let html = "";
        if (this.ctype == CONFIGTYPE_BOOLEAN) {
            html += this.makeList(["Igen", "Nem"]);
        } else if (this.ctype == CONFIGTYPE_LIST) {
            html += this.makeList(this.valueList);
        }
        return html;
    }

    createConfigHtml()  {
        let html = "<div class=\"configBox configItemName\">" + this.name + ":</div>"
            + "<div class=\"configBox configItemValue\">" + this.inputField() +"</div>";
        

        return html;
    }
}
