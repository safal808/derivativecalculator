function Calculator() {
    this.graph = null;
    this.colors = ["black", "crimson", "darkorange", "gold", "green", "blue", "indigo", "purple"];
    this.numResults = 0;
    this.curves = [];
    this.reset = function() {
        this.numResults = 0;
        this.graph = JXG.JSXGraph.initBoard("graph", { boundingbox: [-5, 5, 5, -5], axis: true });
        this.curves = [];
    }
}

var calculator = new Calculator();

function clearResults() {
    var ul = document.getElementById("results");
    while (ul.firstChild)
        ul.removeChild(ul.firstChild);
    var opts = document.getElementById("graph_options");
    while (opts.firstChild)
        opts.removeChild(opts.firstChild);
    calculator.reset();
}

function showError(err) {
    var title = document.createElement('p');
    title.innerHTML = "Error";
    title.classList.add("subtitle");
    title.classList.add("error");
    title.style.color = "#c70039";
    var result = document.createElement('p');
    var li = document.createElement('li');
    result.id = "result";
    result.innerHTML = err;
    result.classList.add("error");
    li.appendChild(title);
    li.appendChild(result);
    document.getElementById("results").appendChild(li);
    MathJax.typeset();
}

function showResult(eq, text) {
    var title = document.createElement('p');
    title.innerHTML = text;
    title.classList.add("subtitle");
    var result = document.createElement('p');
    var li = document.createElement('li');
    result.id = "result";
    result.classList.add("mathjax");
    result.innerHTML = "$$" + eq.toTex() + "$$";
    li.appendChild(title);
    li.appendChild(result);
    document.getElementById("results").appendChild(li);
    MathJax.typeset();
}

function onOptionChanged(e) {
    if (e.target.checked)
        calculator.curves[e.target.id].setAttribute({ visible: true });
    else
        calculator.curves[e.target.id].setAttribute({ visible: false });
}

function createGraphOption() {
    var graphOptions = document.getElementById("graph_options");
    var li = document.createElement('li');
    li.classList.add("option_li");
    var checkbox = document.createElement('input');
    checkbox.id = calculator.numResults - 1;
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.addEventListener('change', onOptionChanged);
    var label = document.createElement('label');
    var wrt = document.getElementById("wrt_input").value;
    var text = "\\(f";
    for (let i = 1; i < calculator.numResults; ++i)
        text += "'";
    text += '(' + wrt + ")\\)";
    label.appendChild(document.createTextNode(text));
    label.style.color = calculator.colors[calculator.numResults - 1];
    li.appendChild(checkbox);
    li.appendChild(label);
    graphOptions.appendChild(li);
    MathJax.typeset()
}

function createGraph(eq) {
    var overlay = document.getElementById("graph_overlay");
    var overlay_text = document.getElementById("graph_overlay_text");
    try {
        overlay.style.display = "none";
        overlay_text.style.display = "none";
        const eq_compiled = math.compile(eq.toString());
        var wrt = document.getElementById("wrt_input").value;
        fn = function(a) {
            let scope = {};
            scope[wrt] = a;
            return eq_compiled.evaluate(scope);
        }
        var curve = calculator.graph.create('functiongraph', fn, { strokeColor: calculator.colors[calculator.numResults] });
       calculator.curves.push(curve);
        ++calculator.numResults;
        createGraphOption();
    } catch (err) {
        overlay.style.display = "table";
        overlay_text.style.display = "table-cell";
        overlay_text.innerHTML = "Unable to draw graph: <br/>" + err;
    }
}

function derive(eq, order) {
    try {
        var wrt = document.getElementById("wrt_input").value;
        var result = math.derivative(eq, math.parse(wrt));
        showResult(result, "Order " + calculator.numResults);
        createGraph(result);
        if (order == 1)
            return;
        derive(result, order - 1);
    } catch (err) {
        showError("Unable to find derivative:<br/>" + err);
    }
}

function simplify(eq) {
    var result = math.simplify(eq);
    showResult(result, "Simplified");
}

function processInput(event) {
    event.preventDefault();
    clearResults();
    document.getElementById("graph").style.display = "block";
    var formElements = event.currentTarget.elements;
    var eq = math.parse(formElements.eq_input.value);
    createGraph(eq);
    if (formElements.simplify_check.checked) {
        simplify(eq);
    } else if (formElements.differentiate_check.checked) {
        let order = formElements.order_input.value;
        derive(eq, order);
    }
}

function updateMathJaxDisplay() {
    var eq_input = document.getElementById("eq_input").value;
    var rawInput = eq_input;
    if (document.getElementById("differentiate_check").checked) {
        var order = document.getElementById("order_input").value;
        if (order != 1) {
            order = '^' + order;
        } else {
            order = "";
        }
        var wrt = document.getElementById("wrt_input").value;
        rawInput = "[d" + order + "/d" + wrt + order + ']' + eq_input;
    }
    let node = math.parse(rawInput);
    var display = document.getElementById("input_display");
    display.innerHTML = "$$" + node.toTex() + "$$";
    display.classList.remove("error");
    MathJax.typeset();
}

function onInputChanged() {
    var submit = document.getElementById("eq_submit")
    var display = document.getElementById("input_display");
    try {
        updateMathJaxDisplay();
        submit.style.backgroundColor = "#195e83"
        submit.disabled = false;
    } catch (err) {
        display.innerHTML = err;
        display.classList.add("error");
        submit.style.backgroundColor = "grey"
        submit.disabled = true;
    }
}

function onOperationChanged() {
    let simplify = document.getElementById("simplify_check").checked;
    document.getElementById("options").style.display = simplify ? "none" : "inline";
}

function init() {
    calculator.reset();
    document.querySelectorAll("input").forEach(ele => {
        ele.addEventListener('input', onInputChanged);
        ele.addEventListener('propertychange', onInputChanged);
    });
    document.querySelectorAll("input[type=radio]").forEach(ele => {
        ele.addEventListener('change', onOperationChanged);
        ele.addEventListener('propertychange', onOperationChanged);
    })
    document.getElementById("input_form").addEventListener('submit', processInput);
}

window.onload = init;
