## Problem Description

When you open this online judge website, you may notice something unusual — this Judge does not have an upload button!

As using Git is an essential skill for computer science students, we’ve decided to use Git as the submission method for this Judge system.

Once you learn how to use Git to submit your code, you’ll be able to solve this problem effortlessly!

## Git Installation

For installation instructions on various operating systems, refer to the [official Git documentation](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git).

### Windows

On Windows, you can install Git for Windows as described in the official documentation. However, many development tools commonly used in CS are not well-supported or natively available on Windows (such as Git projects).

An alternative approach is to use the Windows Subsystem for Linux (WSL). Refer to the [WSL installation guide](https://learn.microsoft.com/en-us/windows/wsl/install) and the [VS Code integration tutorial](https://code.visualstudio.com/docs/remote/wsl).

## About SSH Key

For security reasons (and for educational purposes), the Judge system only allows Git submissions via SSH Key authentication. If you're unfamiliar with SSH Key authentication and its advantages, you can learn more about it [here](https://www.ssh.com/academy/ssh-keys).

### Checking if SSH Key exists

Before proceeding, check if you already have an SSH Key by running the following command:

```sh
$ ls ~/.ssh
config  id_ed25519  id_ed25519.pub  id_rsa  id_rsa.pub  known_hosts \
  known_hosts.old
```

If you see files such as `id_ed25519.pub` or `id_rsa.pub`, you already have an SSH key, and you can skip the key generation step.

### Generating Your Own SSH Key

To generate an SSH Key, run:

```sh
$ ssh-keygen
Generating public/private ed25519 key pair.
...
The key's randomart image is:
+--[ED25519 256]--+
|             .B@.|
|       . o . +=.+|
|      . = = + .o |
|       . B = +  .|
|        S * + o =|
|         = + + +.|
|        ..= =    |
|         oE+ =...|
|          o.o =+.|
+----[SHA256]-----+
```

When prompted, you can simply press `Enter` to accept the default settings.

### Viewing your SSH Key

Once generated, use the following command to print your SSH public key if the default setting was adopted:

```sh
$ cat ~/.ssh/id_ed25519.pub
ssh-ed25519 \
  AAAAC3NzaC1lZDI1NTE5AAAAIFCLYUGx5P6gwckWhkb61xfmweiUl1TIUVW7Gn6jxaxn \
  seantsao00@GA402RJ
```

The file storing your SSH public key may be different if you already have an existing SSH key.

**Important:** Your SSH private key (e.g., `~/.ssh/id_ed25519`) is highly confidential—**never share it**. Your SSH public key (`~/.ssh/id_ed25519.pub`), however, can be shared with others for authentication. For example, for our Judge system.

## Using Git to Submit Your Code to the Judge

Navigate to the top-right corner of the Judge interface and click the **Profile** button to enter your account settings.

<img src="https://hackmd.io/_uploads/HJ0NJug9Jx.png" width="100%">

Paste your SSH public key, in the format of `id_xxx.pub`, into the `SSH Public Key` field. Enter your current Judge password in the `Current password` field at the bottom, then click `Send` to submit.

If a green pop-up appears in the bottom-right corner, the operation was successful. If it’s red, there was an error—check the message and troubleshoot accordingly.

Next, take note of the **Git Repository** displayed on the page. This is the repository where you will submit your code. We’ll refer to it as `<Your Git Repo>` in the steps below.

On your computer, navigate to a directory where you'd like to store your Judge submissions and run:

```sh
git clone <Your Git Repo>
```

If successful, you should see a new folder named after your student ID (e.g., `B00902099`). This folder serves as your communication channel with the DSA Judge, and all future submissions will go here. If you're using VS Code, you can open this folder in it.

Now, create a folder named `0` inside the cloned repository, and inside that folder, create a file named `0.c`. Your directory structure should look like this:

```sh
$ tree
.
└── 0
    └── 0.c

2 directories, 1 file
```

Copy the following code into `0/0.c`:

```c
#include <stdio.h>

int main() {
  printf("The AC code of problem 0!\n");

  return 0;
}
```

Next, inside the directory named after your student ID, run the following Git commands to submit your code:

```sh
git add .
git commit -m "My first submission :)"
git push
```

If you see an error about Git user identity not being set, follow the on-screen instructions to configure it:

```sh
git config --global user.name "John Doe"
git config --global user.email johndoe@example.com
```

**Tip:** If you have (or plan to have) a GitHub account, which is most likely for a CS student, the email address configured on Git on your computer shall match one of your GitHub email addresses.

After pushing the changes, you should see the submission results on Judge. The `git push` output will also include a **Submission ID**.

Here is a example of how to use Judge:

```sh
$ git clone git@dsa-2025.csie.org:B00902099.git
Cloning into 'B00902099'...
Initialized empty Git repository in /home/git/repositories/B00902099.git/
warning: You appear to have cloned an empty repository.

$ cd B00902099

B00902099$ mkdir 0

B00902099$ vim 0/0.c

B00902099$ git add .

B00902099$ git commit -m "My first submission :)"
[main (root-commit) c015819] My first submission :)
 1 file changed, 8 insertions(+)
 create mode 100644 0/0.c
 
B00902099$ git push
Enumerating objects: 8, done.
...
remote: Checking for submissions between 0000000 and 4adf026...
remote: Changed files:
remote:     0/0.c
remote: You submit Problem #0 with 4adf026!
remote: Submission URL: https://dsa-2025.csie.org/#!/submission/155
remote: All submissions are successful!
To dsa-2025.csie.org:B00902099.git
 * [new branch]      main -> main
```

## Notes

If you encounter any issues, and you've followed the instructions carefully, feel free to ask for help in the course's Discord server, or email to the [course TAs](mailto:dsa_ta@csie.ntu.edu.tw ).

### **Submission Rules**

- Each user can submit each problem a maximum of **ten times per day**. Unused attempts do not carry over. Once you reach the limit for a problem, you can no longer push changes to remote until the next day. However, submissions to other problems will still be accepted when trying to push.
- Only modifications to the **`main` branch** are considered. Changes to other branches will not be uploaded.

### **Repository-Specific Notes**

- The Git repository on Judge is **not** hosted on GitHub. Do not confuse them.
- The Judge system only supports SSH Keys in the format `ssh-<algorithm> <base64> <comment>`, which is aligned with the OpenSSH format. Other formats are not acceptable.

### **File & Storage Guidelines**

- The Judge system only accepts code stored in the correct location within the main branch: `./<problem_id>/<problem_id>.c`. Other files will be ignored.
- Avoid pushing too many unnecessary files. If you exceed the storage limit, you may be unable to submit further changes.

### **About Git**

- **Do not rebase commits** on the main branch after they have been pushed. Doing so may prevent future submissions.
-Here is what Judge actually does:
  - Check if the main branch is updated.
  - For every changed file, check if the file exists in the last commit, and if the location is correct.
  - If so, submit the file to Judge.
  - If any of submissions fail, no commits will be pushed to the remote.
