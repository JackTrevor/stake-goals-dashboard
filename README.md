# Painel de Metas — Estaca Jaboatão dos Guararapes

Painel estático, sem dependências externas, criado a partir dos relatórios de junho, julho e agosto de 2026. Está preparado para publicação gratuita no GitHub Pages.

## Abrir

Abra `dist/index.html` em um navegador moderno. Para uma experiência mais consistente, execute um servidor local dentro da pasta `dist`:

```powershell
python -m http.server 4173
```

Depois acesse `http://localhost:4173`.

## Dados

- Os dados oficiais compartilhados ficam em `dist/data.js`.
- Os relatórios inseridos pelo formulário são rascunhos salvos no `localStorage` do navegador.
- Use **Exportar dados** para baixar um backup JSON.
- Use **Importar JSON** para restaurar ou transferir os dados.
- Um campo vazio significa “dado indisponível”, não zero.

## Atualização mensal

1. Insira ou importe o novo relatório no painel.
2. Use **Exportar dados** para revisar e guardar a versão recebida.
3. Copie o novo relatório aprovado para a lista `reports` em `dist/data.js`.
4. Atualize `version`, `updatedAt` e, quando aplicável, `unitReportLabel` e `units`.
5. Faça commit e push para a branch `main`. O GitHub Pages publicará a nova versão automaticamente.

Quando a versão publicada muda, ela prevalece sobre rascunhos locais do mesmo mês. Meses locais ainda não publicados são preservados.

## Publicação no GitHub Pages

O workflow `.github/workflows/deploy-pages.yml` publica a pasta `dist` a cada push para `main`.

1. Crie um repositório público no GitHub e envie este projeto para a branch `main`.
2. No repositório, abra **Settings → Pages**.
3. Em **Build and deployment → Source**, escolha **GitHub Actions**.
4. Aguarde o workflow **Publicar painel no GitHub Pages** terminar.

Site publicado: <https://jacktrevor.github.io/stake-goals-dashboard/>

## Fontes iniciais

- Relatório sumarizado — junho de 2026
- Relatório sumarizado — julho de 2026
- Relatório mensal de acompanhamento — agosto de 2026

