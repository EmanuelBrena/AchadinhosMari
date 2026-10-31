
const API_URL = './produtos.json';

// Coloque os links reais das redes sociais da Mari.
const REDES = {
  instagram: '',
  telegram: ''
};

const area = document.getElementById('produtos');
const mensagem = document.getElementById('mensagem');
const pesquisa = document.getElementById('pesquisa');
const categorias = document.getElementById('categorias');
const ordenacao = document.getElementById('ordenacao');
const contador = document.getElementById('contador');

let produtos = [];
let categoriaAtiva = '';

document.getElementById('ano').textContent = new Date().getFullYear();

function urlSegura(valor) {
  try {
    const url = new URL(valor);
    return ['http:', 'https:'].includes(url.protocol)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function configurarRedes() {
  const links = [
    ['nav-insta', REDES.instagram],
    ['instagram', REDES.instagram],
    ['telegram', REDES.telegram]
  ];

  for (const [id, endereco] of links) {
    const url = urlSegura(endereco);

    if (!url) continue;

    const elemento = document.getElementById(id);
    elemento.href = url;
    elemento.hidden = false;
  }

  if (urlSegura(REDES.instagram) || urlSegura(REDES.telegram)) {
    document.getElementById('social-placeholder').hidden = true;
  }
}

function elemento(tag, classe, texto) {
  const el = document.createElement(tag);

  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;

  return el;
}

function cardProduto(produto) {
  const card = elemento('article', 'card');

  const imagemUrl = urlSegura(produto.imagem_url);

  if (imagemUrl) {
    const imagem = elemento('img', 'card-image');

    imagem.src = imagemUrl;
    imagem.alt = produto.nome_produto || 'Produto';
    imagem.loading = 'lazy';

    imagem.onerror = () => {
      imagem.replaceWith(
        elemento('div', 'placeholder', '🛍️')
      );
    };

    card.append(imagem);
  } else {
    card.append(
      elemento('div', 'placeholder', '🛍️')
    );
  }

  const conteudo = elemento('div', 'card-content');

  const categoria = elemento(
    'span',
    'card-category',
    produto.categoria || 'Achadinho'
  );

  const nome = elemento(
    'h3',
    'card-title',
    produto.nome_produto || 'Produto'
  );

  const numero = Number(produto.preco);

  const preco = elemento(
    'p',
    'card-price',
    produto.preco !== null &&
    produto.preco !== undefined &&
    produto.preco !== '' &&
    Number.isFinite(numero)
      ? numero.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        })
      : 'Consulte o preço'
  );

  const link = elemento('a', 'offer', 'Ver oferta ↗');

  const destino = urlSegura(produto.link_afiliado);

  if (destino) {
    link.href = destino;
    link.target = '_blank';
    link.rel = 'noopener noreferrer sponsored';
  } else {
    link.textContent = 'Oferta indisponível';
    link.classList.add('disabled');
    link.setAttribute('aria-disabled', 'true');
  }

  conteudo.append(categoria, nome, preco, link);
  card.append(conteudo);

  return card;
}

function atualizarCategorias() {
  const nomes = [
    ...new Set(
      produtos
        .map(p => String(p.categoria || '').trim())
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  categorias.replaceChildren();

  for (const nome of ['', ...nomes]) {
    const opcao = document.createElement('option');

    opcao.value = nome;
    opcao.textContent = nome || 'Todas as categorias';

    categorias.append(opcao);
  }

  categorias.value = categoriaAtiva;
}

function renderizar() {
  const termo = pesquisa.value
    .trim()
    .toLocaleLowerCase('pt-BR');

  const filtrados = produtos.filter(p => {
    const nome = String(p.nome_produto || '')
      .toLocaleLowerCase('pt-BR');

    return (
      nome.includes(termo) &&
      (!categoriaAtiva || p.categoria === categoriaAtiva)
    );
  });

  if (ordenacao.value === 'menor') {
    filtrados.sort(
      (a, b) => Number(a.preco) - Number(b.preco)
    );
  } else if (ordenacao.value === 'maior') {
    filtrados.sort(
      (a, b) => Number(b.preco) - Number(a.preco)
    );
  } else if (ordenacao.value === 'az') {
    filtrados.sort(
      (a, b) => String(a.nome_produto || '')
        .localeCompare(String(b.nome_produto || ''), 'pt-BR')
    );
  } else {
    filtrados.sort(
      (a, b) => Number(b.id || 0) - Number(a.id || 0)
    );
  }

  area.replaceChildren(...filtrados.map(cardProduto));

  contador.textContent =
    `${filtrados.length} ${
      filtrados.length === 1 ? 'produto' : 'produtos'
    }`;

  mensagem.textContent = filtrados.length
    ? ''
    : 'Nenhum achadinho encontrado. Tente outra busca ou categoria.';
}

async function carregarProdutos() {
  try {
    const resposta = await fetch(API_URL, {
      cache: 'no-cache'
    });

    if (!resposta.ok) {
      throw new Error(`HTTP ${resposta.status}`);
    }

    const dados = await resposta.json();

    if (!Array.isArray(dados)) {
      throw new Error('Formato inesperado dos produtos');
    }

    produtos = dados;

    atualizarCategorias();
    renderizar();

  } catch (erro) {
    console.error('Erro ao carregar produtos:', erro);

    contador.textContent = 'Indisponível';

    mensagem.textContent =
      'Não foi possível carregar os achadinhos. Atualize a página e tente novamente.';
  }
}

pesquisa.addEventListener('input', renderizar);

ordenacao.addEventListener('change', renderizar);

categorias.addEventListener('change', () => {
  categoriaAtiva = categorias.value;
  renderizar();
});

configurarRedes();
carregarProdutos();
