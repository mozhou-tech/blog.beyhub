---
title: Linux常用操作备忘
tags:
  - Linux
categories:
  - Linux
toc: true
date: 2022-04-13 09:15:21

---

## 系统管理

### 设置开机自启动

#### 方法一：rc.local文件中添加自启动命令

1. `执行命令`： 编辑"/etc/rc.local"，添加你想开机运行的命令
2. `运行程序脚本`：然后在文件最后一行添加要执行程序的全路径。例如，每次开机时要执行一个hello.sh，这个脚本放在/usr下面，那就可以在"/etc/rc.local"中加一行"/usr/./hello.sh"，或者" cd /opt && ./hello.sh "（注意，你的命令应该添加在：exit 0 之前）

#### 方法二：在/etc/init.d目录下添加自启动脚本

Linux在“/etc/rc.d/init.d”下有很多的文件，每个文件都是可以看到内容的，其实都是一些shell脚本或者可执行二进制文件。Linux开机的时候，会加载运行/etc/init.d目录下的程序，因此我们可以把想要自动运行的脚本放到这个目录下即可。系统服务的启动就是通过这种方式实现的。

