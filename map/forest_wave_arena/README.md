# Forest Wave Arena - Cemetery Version

Mapa novo para abrir no Tiled.

Ficheiro principal:
- `forest_wave_arena.tmx`

Preview:
- `preview.png`
- `preview_small.png`

Tema:
- cemitério organizado
- quatro zonas de sepulturas
- muros e entradas nas quatro direções
- caminhos de pedra em cruz para guiar as waves
- arena central limpa para combate
- cripta/túmulo no norte para boss spawn
- árvores e vegetação nas bordas

Layers:
- `base_grass`: relva base
- `grass_detail`: variação leve da relva
- `stone_paths`: caminhos de pedra limpos
- `cemetery_walls`: muros/vedações do cemitério
- `ground_props`: pedras, caixas, pequenos detalhes
- `graves_and_tombs`: lápides, túmulos e cripta
- `plants`: árvores e arbustos
- `collision`: camada escondida para obstáculos principais
- `gameplay_markers`: spawns e marcadores de gameplay

Object markers:
- `player_spawn`
- `enemy_spawn_north`
- `enemy_spawn_south`
- `enemy_spawn_west`
- `enemy_spawn_east`
- `boss_spawn_crypt`
- `reward_chest`

Notas:
- Esta versão substitui o TMX anterior dentro desta pasta.
- O mapa está validado com 70x46 tiles e todas as layers têm o tamanho correto.
- Ainda não foi ligado ao `public/assets/maps/map1.json`; primeiro convém abrir no Tiled e ajustar se quiseres.
