var custom_example= (function () {
   
    let history = [];
    let historyIndex = -1;

    function escapeHtml(html) {
      const text = document.createTextNode(html);
      const p = document.createElement('p');
      p.appendChild(text);
      return p.innerHTML;
    }

    function sendCommand() {
      const inputField = document.getElementById('terminal-input');
      const command = inputField.value;

      if (command.trim() === '') return;

      // Add command to terminal
      document.getElementById('terminal-output').innerHTML += `<div>> ${escapeHtml(command)}</div>`;

      // Send command to backend
      fetch('/sidebar/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      })
      .then(response => response.json())
      .then(data => {
        // Display output
        const output = data.output;//.replace(/\n/g, '<br>'); // Convert line breaks to <br>
        document.getElementById('terminal-output').innerHTML += `<div>${escapeHtml(output)}</div>`;
        // Scroll to the bottom
        const terminal = document.getElementById('terminal-output');
        terminal.scrollTop = terminal.scrollHeight;
      })
      .catch(error => {
        document.getElementById('terminal-output').innerHTML += `<div>Error: ${escapeHtml(error.message)}</div>`;
        // Scroll to the bottom
        const terminal = document.getElementById('terminal-output');
        terminal.scrollTop = terminal.scrollHeight;
      });

      // Add command to history and clear input field
      if (history.length === 0 || history[history.length - 1] !== command) {
        history.push(command);
      }
      historyIndex = history.length;
      inputField.value = '';
    }

    function handleKeyDown(event) {
      const inputField = document.getElementById('terminal-input');
      if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default action (form submission or newline)
        sendCommand();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (historyIndex > 0) {
          historyIndex--;
          inputField.value = history[historyIndex];
        }
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (historyIndex < history.length - 1) {
          historyIndex++;
          inputField.value = history[historyIndex];
        } else {
          historyIndex = history.length;
          inputField.value = '';
        }
      }
    }

    // Add event listener for Enter key and Arrow keys
    document.getElementById('terminal-input').addEventListener('keydown', handleKeyDown);
 
    return {
        sendCommand
    };


})();
addSidebarStyles("panels/terminal/style.css?v=3421");

