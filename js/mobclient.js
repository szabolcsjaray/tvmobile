var started = false;
var myName = "";
var listenPort;
var sendPort;

function init() {
    console.log("init started.");
    //el("send").onclick = processSend;
    el("start").onclick = startPage;
    scrabbleInit();
}

function pxVal(str)  {
    return str.replace("px", "");
}

function startPage() {
    if (started) {
        return;
    }
    started = true;
    myName = el("nameStr").value;
    el("nameStr").disabled = true;
    el("start").style.display = "none";
    el("startGame").style.display = "inline-block";
    //el("inputStr").disabled = false;
    //el("send").disabled = false;
    readResource("cgi-bin\\getport.py?name="+encodeURIComponent(myName), processPorts);
}


window.onload = init;