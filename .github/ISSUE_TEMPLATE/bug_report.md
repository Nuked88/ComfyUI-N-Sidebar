---
name: Bug report
about: Create a report to help us improve
title: ''
labels: bug
assignees: ''

---

**Prerequisites**

Before submitting a bug report, please ensure you have followed these steps:

1. **Browser Verification:**
   - Check if the issue occurs in a different browser.
   - Alternatively, try to reproduce the issue in incognito mode (this helps rule out cache-related issues).
   - If the issue is related to cache, clear the cache for the ComfyUI address (usually 127.0.0.1:8188 if it's running in local) in your browser settings or try with force Reload: Ctrl + F5 on Windows or Cmd + Shift + R on macOS

2. **Sidebar Test:**
   - Remove additional nodes by doing the following:
     - Navigate to the `custom_nodes` folder.
     - Cut all nodes and paste them into a temporary folder outside of `custom_nodes`, except for `ComfyUI-N-Sidebar` and, if present, `ComfyUI-Manager`**.
   - Launch ComfyUI and test if the problem persists.
   
** you can restore the original situation by moving back the nodes from the temporary folder to the `custom_nodes` folder and restarting  ComfyUI.

3. **Identify Node Conflicts:**
   - If the problem is resolved, it is likely caused by a conflict with one of the removed nodes.
   - Try to identify the conflicting node: maybe it was added recently if the problem did not exist before.
   - If you find the conflicting node, please open an issue to inform me so I can attempt to resolve the problem (if possible).

**Bug Report**

If the problem persists after following the above steps, please provide the following information:

- **Description:**
  - Provide a brief description of the bug.

- **Steps to Reproduce:**
  - List the steps you took to encounter the issue.

- **Expected Behavior:**
  - Describe what you expected to happen.

- **Actual Behavior:**
  - Describe what actually happened.

- **System Information:**
  - **Operating System:**
  - **Browser:**

**Additional Context**

Provide any additional information that may help in resolving the issue.
