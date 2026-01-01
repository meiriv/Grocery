# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e3]:
    - banner [ref=e4]:
      - heading "My Lists" [level=1] [ref=e6]
    - main [ref=e7]:
      - generic [ref=e8]:
        - img [ref=e10]
        - paragraph [ref=e14]: No lists yet. Create your first one!
        - button "New List" [ref=e15] [cursor=pointer]:
          - img [ref=e16]
          - text: New List
    - button "New List" [ref=e17] [cursor=pointer]:
      - img [ref=e18]
    - navigation [ref=e19]:
      - generic [ref=e20]:
        - link "My Lists" [ref=e21] [cursor=pointer]:
          - /url: /
          - img [ref=e22]
          - generic [ref=e25]: My Lists
        - link "Favorites" [ref=e26] [cursor=pointer]:
          - /url: /favorites
          - img [ref=e27]
          - generic [ref=e29]: Favorites
        - link "Categories" [ref=e30] [cursor=pointer]:
          - /url: /categories
          - img [ref=e31]
          - generic [ref=e33]: Categories
        - link "Settings" [ref=e34] [cursor=pointer]:
          - /url: /settings
          - img [ref=e35]
          - generic [ref=e38]: Settings
```