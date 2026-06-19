# 2D Enemy Waves

## 1. Elementos do grupo
- Nome: João Marcelo Boucinha Barbosa - 32536
- Nome: Micael Vieira da Costa - 23121

## 2. Tecnologias e dependencias
- Phaser: `3.90.0`
- Bundler: `Vite`
- Gestor de pacotes: `npm`
- Editor de mapas: `Tiled`
- Scripts principais:
  - `npm run dev`
  - `npm run build`
  - `npm run dev-nolog`
  - `npm run build-nolog`

## 3. Descricao do jogo
`2D Enemy Waves` e um jogo 2D de acao e sobrevivencia em arena. O jogador controla uma Wraith, enfrenta ondas sucessivas de zombies, recolhe essencia e investe pontos em upgrades para sobreviver mais tempo e evoluir a personagem.

O ciclo principal do jogo e: menu -> jogo -> combate por waves -> recolha de essencia -> upgrades/evolucao -> derrota ou vitoria. A run termina em `Game Over` quando a vida chega a zero, ou em `Vitoria` ao limpar a wave 10.

Apesar de visualmente ser um jogo simples, o projeto tem varios sistemas internos: mapa Tiled, colisao, inimigos, waves, HUD, upgrades, evolucao da personagem, animacoes, menus e suporte PT/EN.

## 4. Genero, objetivo, regras e funcionalidades
- Genero: acao / sobrevivencia em arena 2D
- Objetivo: sobreviver as waves, derrotar inimigos, melhorar a build e chegar ao fim da run
- Regras principais:
  - cada inimigo derrotado pode largar essencia;
  - a essencia permite investir nos upgrades da build;
  - a personagem evolui ao atingir certos patamares de pontos gastos;
  - morrer termina a run;
  - limpar a wave 10 ativa a vitoria.
- Funcionalidades implementadas:
  - movimento do jogador;
  - ataque melee e cast a distancia;
  - inimigos com vida, ataque, dano e morte;
  - sistema de waves com dificuldade progressiva;
  - mapa criado no Tiled e carregado em Phaser;
  - colisao com o mapa atraves da layer `collision` do Tiled;
  - HUD com vida, score, wave, inimigos e progresso da build;
  - menu principal;
  - menu de build/evolucao;
  - `Game Over` e `Vitoria`;
  - reinicio rapido da run;
  - suporte PT/EN;
  - efeitos sonoros de combate, recolha e fim de jogo.

## 5. Controlos
- `WASD`: mover
- `J`, `SPACE`, `K` ou clique esquerdo: atacar
- `E` ou clique direito: cast / habilidade
- `U`: abrir / fechar menu de build
- `N`: evoluir a personagem quando disponivel
- `1-6`: investir pontos nos upgrades
- `R`: reiniciar a run
- `ESC`: fechar o menu de build

## 6. Como executar
### Desenvolvimento
```bash
npm install
npm run dev
```

O Vite arranca por omissao em `http://localhost:8080`.

### Desenvolvimento sem logs extra
```bash
npm run dev-nolog
```

### Build de producao
```bash
npm run build
```

O output final fica na pasta `dist/`.

## 7. Mapa e Tiled
O mapa principal foi criado no Tiled e esta guardado em:

- `public/assets/maps/map3.json`

O Phaser carrega este mapa no `Preloader` com a chave `test-map`.

Tilesets carregados em runtime:
- `public/assets/map/TX Tileset Grass.png`
- `public/assets/map/TX Tileset Wall.png`
- `public/assets/map/TX Props with Shadow.png`
- `public/assets/map/TX Plant with Shadow.png`
- `public/assets/map/TX Props.png`

A colisao do mapa e controlada por uma layer do Tiled chamada:

- `collision`

Essa layer pode estar invisivel no Tiled, mas continua a ser lida pelo jogo para criar zonas de colisao em Phaser.

## 8. Aspetos multimedia
### Imagens
- **Mapa**: tiles pixel art top-down carregados a partir de `public/assets/map/` e mapa exportado do Tiled em `public/assets/maps/map3.json`.
- **Inimigos**: sprites de zombies provenientes de packs com licenca Craftpix, conforme `public/assets/enemy/License.txt`.
- **Jogador**: sprites `Wraith` provenientes de pack com licenca Craftpix, conforme `public/assets/player1/TXT/license.txt`.

### Formatos usados em runtime
- Mapas Tiled: `JSON`
- Tilesets e sprites: `PNG`
- Efeitos sonoros: `WAV`
- Musica de fundo: `OGG Vorbis`

### Audio
Os efeitos sonoros estao em `public/assets/audio/`.

Ficheiros usados:
- `attack.wav` - ataque melee
- `pickup.wav` - recolha de essencia
- `gameover.wav` - morte / fim da run
- `music.ogg` - musica de fundo em loop, reproduzida com volume baixo (`0.12`)

O ficheiro `music.ogg` esta em formato OGG Vorbis, stereo, 44.1 kHz e cerca de 152 kbps. E um formato adequado para musica de fundo em jogos web porque tem boa compressao e e suportado pelos browsers modernos usados pelo Phaser.

## 9. Estrutura do projeto
```text
src/
├── main.js
└── game/
    ├── main.js
    ├── scenes/
    │   ├── Boot.js
    │   ├── Preloader.js
    │   ├── MainMenu.js
    │   ├── Game.js
    │   └── GameOver.js
    ├── systems/
    │   ├── MapSystem.js
    │   └── HudSystem.js
    ├── data/
    │   ├── gameConstants.js
    │   ├── enemyAnimations.js
    │   ├── enemyTypes.js
    │   ├── playerAnimations.js
    │   ├── playerCharacters.js
    │   ├── playerUpgrades.js
    │   └── settings.js
    └── i18n/
        ├── index.js
        ├── pt.json
        └── en.json
```

### Principais ficheiros
- `src/game/main.js`: configuracao do Phaser e registo das cenas
- `src/game/scenes/Boot.js`: inicializacao e settings
- `src/game/scenes/Preloader.js`: preload de imagens, audio, tilesets e mapa Tiled
- `src/game/scenes/MainMenu.js`: menu principal e escolha de idioma
- `src/game/scenes/Game.js`: cena principal do gameplay
- `src/game/scenes/GameOver.js`: ecra final de derrota / vitoria
- `src/game/systems/MapSystem.js`: carregamento do mapa, layers, colisao e grelha de debug
- `src/game/systems/HudSystem.js`: HUD, painel de build/evolucao e textos de estado
- `src/game/data/gameConstants.js`: constantes principais do jogo
- `src/game/data/`: dados de personagens, animacoes, upgrades, inimigos e settings
- `src/game/i18n/`: traducoes PT/EN

## 10. Organizacao do codigo
O codigo foi separado para evitar que a cena principal tivesse tudo misturado.

- `Game.js` controla o fluxo principal da run e a logica de gameplay.
- `MapSystem.js` trata do mapa, layers do Tiled, bounds e colisoes.
- `HudSystem.js` trata da interface, painel de upgrades e textos do jogo.
- `gameConstants.js` concentra valores fixos como tamanhos, escalas, vida, waves e valores de combate.

Esta separacao facilita a manutencao e torna mais simples explicar o projeto.

## 11. Linhas de codigo
Contagem aproximada atual, sem `node_modules`, `dist`, `.git`, assets binarios e imagens:

- Codigo real do jogo/site: cerca de `4.357` linhas
- Codigo dentro de `src/`: cerca de `4.225` linhas
- Incluindo JSONs, mapas Tiled e Markdown: cerca de `58.465` linhas

Para apresentacao, o numero mais justo e:

> Aproximadamente 4.300 linhas de codigo, sem contar assets nem mapas gerados pelo Tiled.

## 12. Repositorio
- URL do repositorio: `https://github.com/JotaBarbosaDev/2DGame-EnemyWaves`
- Branch principal: `main`

## 13. Screenshot
![Screenshot do jogo](screenshot.png)

## 14. Lacunas conhecidas / roadmap
- O audio foi mantido minimalista para cumprir o requisito com baixo impacto no tamanho final.
- Uma melhoria futura seria separar tambem a logica de player, inimigos, waves e upgrades em sistemas proprios.
