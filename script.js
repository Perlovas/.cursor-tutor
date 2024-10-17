let pyd;
let ed;

async function loadPyd() {
    if (!pyd) {
        pyd = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.22.1/full/"
        });
    }
    return pyd;
}

document.addEventListener('DOMContentLoaded', (e) => {
    ed = CodeMirror(document.getElementById("code-input"), {
        mode: "python",
        theme: "monokai",
        lineNumbers: true,
        indentUnit: 4,
        tabSize: 4,
        matchBrackets: true,
        autoCloseBrackets: true,
        extraKeys: {
            "Tab": function(cm) {
                cm.replaceSelection("    ", "end", "+input");
            }
        }
    });

    ed.setSize("100%", "200px");

    document.getElementById('lang-sel').addEventListener('change', function(e) {
        let mode = e.target.value;
        ed.setOption("mode", mode);
        
        if (mode === "clike") {
            loadScr("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.62.0/mode/clike/clike.min.js");
        }
    });
});

function loadScr(url) {
    return new Promise((res, rej) => {
        let scr = document.createElement('script');
        scr.src = url;
        scr.onload = res;
        scr.onerror = rej;
        document.head.appendChild(scr);
    });
}

document.getElementById('run-btn').addEventListener('click', async function() {
    const code = ed.getValue();
    const out = document.getElementById('output');
    const lang = document.getElementById('lang-sel').value;
    
    out.textContent = 'выполнение...';
    
    try {
        if (lang === 'python') {
            await execPy(code);
        } else if (lang === 'clike') {
            await execCpp(code);
        }
    } catch (err) {
        out.textContent = `ошибка: ${err.message}`;
    }
});

async function execPy(code) {
    const pyd = await loadPyd();
    try {
        pyd.runPython(`
            import sys
            from io import StringIO
            sys.stdout = StringIO()
        `);
        
        await pyd.loadPackagesFromImports(code);
        await pyd.runPythonAsync(code);
        
        let stdout = pyd.runPython("sys.stdout.getvalue()");
        document.getElementById('output').textContent = stdout || 'без вывода';
    } catch (err) {
        document.getElementById('output').textContent = `ошибка: ${err.message}`;
    }
}

async function execCpp(code) {
    const out = document.getElementById('output');
    try {
        const resp = await fetch('https://wandbox.org/api/compile.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: code,
                compiler: 'gcc-head',
                options: 'warning,gnu++17',
                save: false,
                stdin: ''
            })
        });

        const res = await resp.json();
        
        if (res.status === "0") {
            out.textContent = res.program_output || 'без вывода';
        } else {
            throw new Error(res.compiler_error || res.program_error);
        }
    } catch (err) {
        out.textContent = `ошибка c++: ${err.message}`;
    }
}

document.getElementById('next-pg').addEventListener('click', function() {
    alert('след. страница');
});
