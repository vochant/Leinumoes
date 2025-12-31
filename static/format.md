# Leinumoes 格式手册

Leinumoes 使用 Markdown 和 $\KaTeX$ 渲染内容，从而丰富内容展现的形式。若想写好文章、博客、动态和评论，合理地运用 Markdown 和 $\KaTeX$ 是不可或缺的。以下是一些简短的介绍。

Leinumoes 支持 GFM (GitHub Flavored Markdown) 的绝大部分功能，但不支持用户生成内容中直接插入 HTML 片段。Leinumoes 也支持一些杂项 Markdown 扩展语法。

$\KaTeX$ 可以用于书写公式，是一个非常复杂且强大的工具，在此仅提供部分示例，完整地学习 $\KaTeX$ 的功能并不是一件易事。Leinumoes 对 $\KaTeX$ 的支持包括 `mhchem` 扩展包。

[[toc]]

## 0. 换行与分段

```markdown
Paragraph 1

Paragraph 2

Sentence 1
Sentence 2

Line1  
Line2

Line3 \  
Line4
```

Paragraph 1

Paragraph 2

Sentence 1
Sentence 2

Line1  
Line2

Line3 \
Line4

> [!NOTE]
> 换一行的结果是使用空格连接两行，即使是中文文本，而换两行的作用是分段。该段示例的中 Line1 后有两个空格，在行末添加至少两个空格可以换行而不分段。Line3 后有一个转义字符 `\`，也可以实现换行。

## 1. 基本样式

```markdown
普通文字 **粗体** *斜体* ***粗斜体*** ~~删除线~~ ==高亮== !!消除!! `代码` 缩写

\*转义\* !\!转义\!! \~~转义\~~

*[缩写]: 可爱喵
```

普通文字 **粗体** *斜体* ***粗斜体*** ~~删除线~~ ==高亮== !!消除!! `代码` 缩写

\*转义\* !\!转义\!! \~~转义\~~

*[缩写]: 可爱喵

> [!NOTE]
> 转义字符 `\` 可以阻止语法的匹配，如果需要显示一个反斜杠（转义字符）而不产生任何副作用，可以使用两个转义字符 `\\` 表示。

## 2. 标题


```markdown
# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

Mirekintoc
=====

Mirekintoc
-----
```

<h1>Heading 1</h1>

<h2>Heading 2</h2>

<h3>Heading 3</h3>

<h4>Heading 4</h4>

<h5>Heading 5</h5>

<h6>Heading 6</h6>

<h1>Mirekintoc</h1>

<h2>Mirekintoc</h2>

## 3. 链接和 @ 用户

```markdown
<https://www.bilibili.com>

[Codeforces](//codeforces.com)

[EULA](/docs/eula)

[Google][1]

[1]: https://www.google.com/

@Leinumoes

@ExampleInvalidUser
```

<https://www.bilibili.com>

[Codeforces](//codeforces.com)

[EULA](/docs/eula)

[Google][1]

[1]: https://www.google.com/

@Leinumoes

@ExampleInvalidUser

## 4. 无序列表

```markdown
- Item 1
- Item 2
  - 可爱
  - 小伪娘
- Item 3
  - Item 3.1
    - Item 3.1.1
      - Item 3.1.1.1
```

- Item 1
- Item 2
  - 可爱
  - 小伪娘
- Item 3
  - Item 3.1
    - Item 3.1.1
      - Item 3.1.1.1

## 5. 有序列表

```markdown
1. CSP-J/S
   1. CSP-J
      1. CSP-J1
      2. CSP-J2
   2. CSP-S
      1. CSP-S1
      2. CSP-S2
2. NOIP
3. 省选
4. NOI
5. CTT
6. CTS (NOIWC)
7. IOI
```

1. CSP-J/S
   1. CSP-J
      1. CSP-J1
      2. CSP-J2
   2. CSP-S
      1. CSP-S1
      2. CSP-S2
2. NOIP
3. 省选
4. NOI
5. CTT
6. CTS (NOIWC)
7. IOI

``` markdown
100. 偏移
  0. 测试
  0. 测试
```

100. 偏移
  0. 测试
  0. 测试

> [!NOTE]
> 有序列表的后一项总是比前一项大一，且只有第一项能决定起始值。推荐以 1 作为起始值。

## 6. 多行代码

```markdown
‌```cpp
#include <bits/stdc++.h>

int main() {
    std::cout << "Hello World\n";
    return 0;
}
```‌
```

```cpp
#include <bits/stdc++.h>

int main() {
    std::cout << "Hello World\n";
    return 0;
}
```

**为保证正常渲染，本段添加了 `ZWNJ` 字符，请勿直接复制使用。**

> [!NOTE]
> 多行代码的首行可以声明使用的语言，如 `cpp`、`python`、`javascript`、`markdown`，也可以不声明。`plaintext` 表示纯文本。

## 7. TODO 列表

```markdown
- [x] Confirma tuas opiniones.
- [x] Eme saltem unum vestitum muliebre et nonnulla ornamenta necessaria.
- [x] Tempus bonum elige.
- [x] Vestibus muliebribus induere et imagines pulchras capere.
- [ ] Has imagines cum amicis tuis communica.
```

- [x] Confirma tuas opiniones.
- [x] Eme saltem unum vestitum muliebre et nonnulla ornamenta necessaria.
- [x] Tempus bonum elige.
- [x] Vestibus muliebribus induere et imagines pulchras capere.
- [ ] Has imagines cum amicis tuis communica.

## 8. 表格

```markdown
|             |          Grouping           ||
First Header  | Second Header | Third Header |
 ------------ | :-----------: | -----------: |
Content       |          *Long Cell*        ||
Content       |   **Cell**    |         Cell |
New section   |     More      |         Data |
And more      | With an escaped '\\|'       ||
```

|             |          Grouping           ||
First Header  | Second Header | Third Header |
 ------------ | :-----------: | -----------: |
Content       |          *Long Cell*        ||
Content       |   **Cell**    |         Cell |
New section   |     More      |         Data |
And more      | With an escaped '\|'        ||

## 9. 引用

```markdown
> 我常常追忆过去。
>
> 生命瞬间定格在脑海。我将背后的时间裁剪、折叠、蜷曲，揉捻成天上朵朵白云。
>
> 云朵之间亦有分别：积云厚重，而卷云飘渺。生命里震撼的场景掠过我的思绪便一生无法忘怀，而更为普通平常的记忆在时间的冲刷下只留下些许残骸。追忆宛如入梦，太过清楚则无法愉悦自己的幻想，过分模糊却又坠入虚无。只有薄雾间的山水，面纱下的女子，那恰到好处的朦胧，才能满足我对美的苛求。
>
> 追忆总在不经意间将我裹进泛黄的纸页里。分别又重聚的朋友，推倒又重建的街道，种种线索协助着我从一个具体的时刻出发沿时间的河逆流而上。曾经的日子无法重来，我只不过是一个过客。但我仍然渴望在每一次追忆之旅中留下闲暇时间，在一个场景前驻足，在岁月的朦胧里瞭望过去的自己，感受尽可能多的甜蜜。美好的时光曾流过我的身体，我便心满意足。
>
> 过去已经凝固，我带着回忆向前，只是时常疏于保管，回忆也在改变着各自的形态。这给我的追忆旅程带来些许挑战。
>
> 我该在哪里停留？我问我自己。
```

> 我常常追忆过去。
>
> 生命瞬间定格在脑海。我将背后的时间裁剪、折叠、蜷曲，揉捻成天上朵朵白云。
>
> 云朵之间亦有分别：积云厚重，而卷云飘渺。生命里震撼的场景掠过我的思绪便一生无法忘怀，而更为普通平常的记忆在时间的冲刷下只留下些许残骸。追忆宛如入梦，太过清楚则无法愉悦自己的幻想，过分模糊却又坠入虚无。只有薄雾间的山水，面纱下的女子，那恰到好处的朦胧，才能满足我对美的苛求。
>
> 追忆总在不经意间将我裹进泛黄的纸页里。分别又重聚的朋友，推倒又重建的街道，种种线索协助着我从一个具体的时刻出发沿时间的河逆流而上。曾经的日子无法重来，我只不过是一个过客。但我仍然渴望在每一次追忆之旅中留下闲暇时间，在一个场景前驻足，在岁月的朦胧里瞭望过去的自己，感受尽可能多的甜蜜。美好的时光曾流过我的身体，我便心满意足。
>
> 过去已经凝固，我带着回忆向前，只是时常疏于保管，回忆也在改变着各自的形态。这给我的追忆旅程带来些许挑战。
>
> 我该在哪里停留？我问我自己。

## 10. 媒体

```markdown
![test](/file/title.png =640x155)
```

![test](/file/title.png =640x155)

> [!NOTE]
> 此处中括号中的 `test` 对应 HTML 中的 `alt` 属性，图片无法渲染时使用其进行占位。`=640x155` 是 `markdown-it-imsize` 的功能，可以指定图片大小。不指定时图片将会占满整个页面宽度。

```markdown
@[pdf](/file/static/NOI_Syllabus_Edition_2025.pdf)

@[msoffice](https://vochant.github.io/old/test.docx)

@[bilibili](BV1ycJWzBEyF)

@[youtube](dQw4w9WgXcQ)

@[audio](/file/static/Miracle_Forest.mp3)

@[video](/file/static/nvzhuangzhao.mp4)
```

<details>

<summary>这里的内容有点点长哦……</summary>

@[pdf](/file/static/NOI_Syllabus_Edition_2025.pdf)

@[msoffice](https://vochant.github.io/old/test.docx)

@[bilibili](BV1ycJWzBEyF)

@[youtube](dQw4w9WgXcQ)

@[audio](/file/static/Miracle_Forest.mp3)

@[video](/file/static/nvzhuangzhao.mp4)

</details>

> [!NOTE]
> 此处兼容以下服务，并需要填写相应的地址或标识符：
>
> - `bilibili` bilibili 视频
> - `pdf` PDF 文档
> - `msoffice` Microsoft Office 文档
> - `video` 视频文件
> - `audio` 音频文件
> - `youtube` YouTube 视频
>
> 其中 YouTube 在中国大陆不可用。如果无法加载，请检查您的网络环境，Leinumoes 不提倡翻墙且不会提供任何翻墙工具。

## 11. 分割线

```markdown
---
```

---

## 12. 目录

```markdown
[[toc]]
```

[[toc]]

## 13. 行内公式

```markdown
对于所有测试点，
- $1 \leq T \leq 3$，
- $1 \leq n, q \leq 10^5$，$1 \leq m \leq 2 \times 10^5$，
- $\forall 1 \leq i \leq m$，$1 \leq u_i < v_i \leq n$，
- $\forall 1 \leq i \leq n$，$1 \leq a_i \leq n$，且 $[a_1, \ldots, a_n]$ 是 $1 \sim n$ 的一个排列，
- $\forall 1 \leq i \leq n$，$1 \leq b_i \leq n$，且 $[b_1, \ldots, b_n]$ 是 $1 \sim n$ 的一个排列，
- $\forall 1 \leq i \leq q$，$o_i \in \{1, 2, 3\}$，$1 \leq x_i, y_i \leq n$，$1 \leq l_i \leq r_i \leq n$。
```

对于所有测试点，

- $1 \leq T \leq 3$，
- $1 \leq n, q \leq 10^5$，$1 \leq m \leq 2 \times 10^5$，
- $\forall 1 \leq i \leq m$，$1 \leq u_i < v_i \leq n$，
- $\forall 1 \leq i \leq n$，$1 \leq a_i \leq n$，且 $[a_1, \ldots, a_n]$ 是 $1 \sim n$ 的一个排列，
- $\forall 1 \leq i \leq n$，$1 \leq b_i \leq n$，且 $[b_1, \ldots, b_n]$ 是 $1 \sim n$ 的一个排列，
- $\forall 1 \leq i \leq q$，$o_i \in \{1, 2, 3\}$，$1 \leq x_i, y_i \leq n$，$1 \leq l_i \leq r_i \leq n$。

## 14. 块状公式

```markdown
$$
R=g\ast (\bar{I}\circ \bar{I})
$$

$$
\begin{equation}
M=\frac{\sum_{i\in \Omega }\cdot S}{\sum_{i\in \Omega }\cdot 1}
\end{equation}
$$

$$
\begin{equation}
H_{S}=-\sum_{i=1}^{H}\sum_{j=1}^{W}{P}[S(i,j)]\cdot\log{P}[S(i,j)]
\end{equation}
$$

$$
\begin{equation}
Q_{v}=\exp \left [ (H_{S}-u)/d -\exp \left ( (H_{s}-u)/d \right )\right ]/d
\end{equation}
$$

$$
Q=\frac{Q_{v}\cdot{M}}{\sqrt{\min(Q_v,M)}}.
$$

$$
\begin{equation}
S_{E}(Q)=\frac{\alpha_{1}}{1+\exp \frac{\alpha_{2}-Q}{\alpha_{3}}}
\end{equation}
$$

$$
S(x,y)=\left[l_N(x,y)\right]^{\alpha_N}\prod_{j=1}^{N}\left[c_j(x,y)\right]^{\beta_i}\left[l_N(x,y)\right]^{\gamma_j}
$$
```

$$
R=g\ast (\bar{I}\circ \bar{I})
$$

$$
\begin{equation}
M=\frac{\sum_{i\in \Omega }\cdot S}{\sum_{i\in \Omega }\cdot 1}
\end{equation}
$$

$$
\begin{equation}
H_{S}=-\sum_{i=1}^{H}\sum_{j=1}^{W}{P}[S(i,j)]\cdot\log{P}[S(i,j)]
\end{equation}
$$

$$
\begin{equation}
Q_{v}=\exp \left [ (H_{S}-u)/d -\exp \left ( (H_{s}-u)/d \right )\right ]/d
\end{equation}
$$

$$
Q=\frac{Q_{v}\cdot{M}}{\sqrt{\min(Q_v,M)}}.
$$

$$
\begin{equation}
S_{E}(Q)=\frac{\alpha_{1}}{1+\exp \frac{\alpha_{2}-Q}{\alpha_{3}}}
\end{equation}
$$

$$
S(x,y)=\left[l_N(x,y)\right]^{\alpha_N}\prod_{j=1}^{N}\left[c_j(x,y)\right]^{\beta_i}\left[l_N(x,y)\right]^{\gamma_j}
$$

## 15. 公式（化学）

```markdown
$$\ce{2H2(g) + O2(g)->2H2O(g)}$$

$$\ce{Zn^2+  <=>[+ 2OH-][+ 2H+]  $\underset{\text{amphoteres Hydroxid}}{\ce{Zn(OH)2 v}}$  <=>[+ 2OH-][+ 2H+]  $\underset{\text{Hydroxozikat}}{\ce{[Zn(OH)4]^2-}}$}$$
```

$$\ce{2H2(g) + O2(g)->2H2O(g)}$$

$$\ce{Zn^2+  <=>[+ 2OH-][+ 2H+]  $\underset{\text{amphoteres Hydroxid}}{\ce{Zn(OH)2 v}}$  <=>[+ 2OH-][+ 2H+]  $\underset{\text{Hydroxozikat}}{\ce{[Zn(OH)4]^2-}}$}$$

## 16. Emoji

```markdown
:smile: :+1: :cat:

😄 👍 🐱
```

:smile: :+1: :cat:

😄 👍 🐱

> [!NOTE]
> 您可以使用如第一段 GFM (GitHub Flavored Markdown) 式的 Emoji，也可以使用如第二段 Unicode 中自带的 Emoji，但是前者会显示为 Twemoji (Twitter Emoji)，后者则依据您的平台使用的 Emoji 字体。如果希望最好的跨平台一致性和兼容性，那么使用 GFM 式的 Emoji 仍是您的最佳选择。

## 17. 提示框

```markdown
> [!note]
> 注释文字

> [!important]
> 重要文字

> [!tip]
> 提示文字

> [!warning]
> 注意文字

> [!caution]
> 警告文字
```

> [!note]
> 注释文字

> [!important]
> 重要文字

> [!tip]
> 提示文字

> [!warning]
> 注意文字

> [!caution]
> 警告文字

如果你喜欢洛谷个人主页里时常用到的那种 $\LaTeX$ 提示框，Leinumoes 同样支持。

```markdown
$
\newcommand\BorderRect[4]{
  \color{#3}\rule{#1}{#2}\kern{-#1}
  \color{#4}\rule{0.5px}{#2}\kern{-0.5px}
  \rule{#1}{0px}\rule{0.5px}{#2}\kern{-0.5px}
  \kern{-#1}\rule[#2]{#1}{0px}
}
\newcommand\BasicInfoBarFather[8]{
  \BorderRect{#1}{#2}{#5}{ghostwhite}
  \kern{-#1}
  \raisebox{#2}{
    \raisebox{-26pt}{
      \color{black}\kern{-4px}
      \raisebox{7px}{
        \color{#7}\Huge{∙}\kern{-1px}
      }
      \raisebox{10.6px}{
        \kern{-20.2px}
        \color{white}\scriptsize\textbf{#6}
      }
      \kern{-7px}\footnotesize
      \raisebox{10.2px}{\textbf{\textsf{\color{#8}#3}}}\kern{2px}
      \raisebox{10.2px}{\textsf{#4}}
    }
  }
}
\def\BasicInfoBarColorFill{#F4F4F4}\def\BasicInfoBarColorIcon{#0078D4}
\def\BasicWarnBarColorFill{#FFF4CE}\def\BasicWarnBarColorIcon{#9D5D00}
\def\BasicOkBarColorFill{#DFF6DD}\def\BasicOkBarColorIcon{#0F7B0F}
\def\BasicErrBarColorFill{#FDE7E9}\def\BasicErrBarColorIcon{#C42B1C}
\newcommand\BasicInfoBar[5]{
  \BasicInfoBarFather{#1}{#2}{#3}{#4}
  {\BasicInfoBarColorFill}{i}{\BasicInfoBarColorIcon}{\BasicInfoBarColorIcon}
}
\newcommand\BasicWarnBar[5]{
  \BasicInfoBarFather{#1}{#2}{#3}{#4}
  {\BasicWarnBarColorFill}{i}{\BasicWarnBarColorIcon}{\BasicWarnBarColorIcon}
}
\newcommand\BasicOkBar[5]{
  \BasicInfoBarFather{#1}{#2}{#3}{#4}
  {\BasicOkBarColorFill}
  {\tiny\kern{-2px}\raisebox{0.8px}{√}}
  {\BasicOkBarColorIcon}{\BasicOkBarColorIcon}
}
\newcommand\BasicErrBar[5]{
  \BasicInfoBarFather{#1}{#2}{#3}{#4}
  {\BasicErrBarColorFill}
  {\kern{-2px}\raisebox{0.6px}{×}}
  {\BasicErrBarColorIcon}{\BasicErrBarColorIcon}
}
\BasicWarnBar{200px}{26px}{注意}{注意文本}{#000000}\\
\BasicInfoBar{200px}{26px}{提示}{提示文本}{#000000}\\
\BasicErrBar{200px}{26px}{警告}{警告文本}{#000000}\\
\BasicOkBar{200px}{26px}{重要}{重要文本}{#000000}\\
$
```

$
\newcommand\BorderRect[4]{
  \color{#3}\rule{#1}{#2}\kern{-#1}
  \color{#4}\rule{0.5px}{#2}\kern{-0.5px}
  \rule{#1}{0px}\rule{0.5px}{#2}\kern{-0.5px}
  \kern{-#1}\rule[#2]{#1}{0px}
}
\newcommand\BasicInfoBarFather[8]{
  \BorderRect{#1}{#2}{#5}{ghostwhite}
  \kern{-#1}
  \raisebox{#2}{
    \raisebox{-26pt}{
      \color{black}\kern{-4px}
      \raisebox{7px}{
        \color{#7}\Huge{∙}\kern{-1px}
      }
      \raisebox{10.6px}{
        \kern{-20.2px}
        \color{white}\scriptsize\textbf{#6}
      }
      \kern{-7px}\footnotesize
      \raisebox{10.2px}{\textbf{\textsf{\color{#8}#3}}}\kern{2px}
      \raisebox{10.2px}{\textsf{#4}}
    }
  }
}
\def\BasicInfoBarColorFill{#F4F4F4}\def\BasicInfoBarColorIcon{#0078D4}
\def\BasicWarnBarColorFill{#FFF4CE}\def\BasicWarnBarColorIcon{#9D5D00}
\def\BasicOkBarColorFill{#DFF6DD}\def\BasicOkBarColorIcon{#0F7B0F}
\def\BasicErrBarColorFill{#FDE7E9}\def\BasicErrBarColorIcon{#C42B1C}
\newcommand\BasicInfoBar[5]{
  \BasicInfoBarFather{#1}{#2}{#3}{#4}
  {\BasicInfoBarColorFill}{i}{\BasicInfoBarColorIcon}{\BasicInfoBarColorIcon}
}
\newcommand\BasicWarnBar[5]{
  \BasicInfoBarFather{#1}{#2}{#3}{#4}
  {\BasicWarnBarColorFill}{i}{\BasicWarnBarColorIcon}{\BasicWarnBarColorIcon}
}
\newcommand\BasicOkBar[5]{
  \BasicInfoBarFather{#1}{#2}{#3}{#4}
  {\BasicOkBarColorFill}
  {\tiny\kern{-2px}\raisebox{0.8px}{√}}
  {\BasicOkBarColorIcon}{\BasicOkBarColorIcon}
}
\newcommand\BasicErrBar[5]{
  \BasicInfoBarFather{#1}{#2}{#3}{#4}
  {\BasicErrBarColorFill}
  {\kern{-2px}\raisebox{0.6px}{×}}
  {\BasicErrBarColorIcon}{\BasicErrBarColorIcon}
}
\BasicWarnBar{200px}{26px}{注意}{注意文本}{#000000}\\
\BasicInfoBar{200px}{26px}{提示}{提示文本}{#000000}\\
\BasicErrBar{200px}{26px}{警告}{警告文本}{#000000}\\
\BasicOkBar{200px}{26px}{重要}{重要文本}{#000000}\\
$

## 18. 脚注

```markdown
Here is a footnote reference,[^1] and another.[^longnote]

[^1]: Here is the footnote.

[^longnote]: Here's one with multiple blocks.

    Subsequent paragraphs are indented to show that they
belong to the previous footnote.
```

Here is a footnote reference,[^1] and another.[^longnote]

[^1]: Here is the footnote.

[^longnote]: Here's one with multiple blocks.

    Subsequent paragraphs are indented to show that they
belong to the previous footnote.
