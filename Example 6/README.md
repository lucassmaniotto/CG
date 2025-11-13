# Trabalho de Iluminação + Animação de Objeto FBX
- **Descrição:** entregar de um link para o código onde existem um objeto com animações (pode ser o dragão visto em aula). 
  - O objeto deve se locomover e tocar a animação de andar para movimentação. Quando a tecla de andar para de ser pressionada o mesmo deve parar.
  - Junto com isso na GUI devem ser criado um box onde seja possivel selecionar tipos de iluminação que interajam com o ambiente. 
  - **Pelo menos deve ter SpotLight, Directional e Point**.
 
-------------------------------------------------------------------------------
## Dados do Aluno
- **Nome:** Lucas Smaniotto Schuch
- **Matrícula:** 2121101016

## Controles de Iluminação
- Implementadas luzes direcionais, pontuais e spotlights, cada uma com seus respectivos controles na GUI.
- Adicionado Helper para facilitar a visualização dos pontos focais das luzes.

## Controles do Dragão
### Controles de movimento
- Cada tecla altera a posição X do dragão:

````
Seta para Frente: move para frente
Seta para Trás: move para trás
Seta para Esquerda: move para a esquerda
Seta para Direita: move para a direita
````

### Controles especiais
````
Espaço: Faz o dragão voar (altera a posição Y)
Crtl esquerdo: Faz o dragão descer (altera a posição Y, limite mínimo Y=0)
````
