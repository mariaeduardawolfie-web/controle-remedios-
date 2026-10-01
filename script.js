const SUPABASE_URL = "https://mdxgrkrludjmpienkhko.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_hOr0psfQCdV9OpfQBD46BQ_dWozSU1G";

const { createClient } = supabase;

const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let produtos = [];

let produtoEscolhido = null;

let usuarioAtual = null;


/* =========================
   USUÁRIOS
========================= */

const usuarios = [
    "Anelísio",
    "Rogério",
    "Alexandre",
    "Rafael",
    "Carla"
];


function mostrarUsuarios() {

    const lista =
        document.getElementById("listaUsuarios");

    lista.innerHTML = "";


    usuarios.forEach(nome => {

        const botao =
            document.createElement("button");

        botao.className =
            "usuario-botao";

        botao.textContent =
            nome;

        botao.onclick = () =>
            entrar(nome);

        lista.appendChild(botao);

    });
}


function entrar(nome) {

    usuarioAtual = nome;


    localStorage.setItem(
        "usuarioAtual",
        nome
    );


    document.getElementById(
        "usuarioAtual"
    ).textContent =
        `👤 ${nome}`;


    document.getElementById(
        "telaUsuario"
    ).classList.add("escondido");


    document.getElementById(
        "sistema"
    ).classList.remove("escondido");


    document.getElementById(
        "nome"
    ).value = nome;


    carregarMedicamentos();
}


function trocarUsuario() {

    usuarioAtual = null;


    localStorage.removeItem(
        "usuarioAtual"
    );


    document.getElementById(
        "sistema"
    ).classList.add("escondido");


    document.getElementById(
        "telaUsuario"
    ).classList.remove("escondido");

}


/* =========================
   MEDICAMENTOS
========================= */

async function carregarMedicamentos() {

    try {

        const {
            data,
            error
        } = await db
            .from("medicamentos")
            .select("*")
            .order("id");


        if (error) {
            throw error;
        }


        produtos = data || [];


        mostrarProdutos();

        atualizarDashboard();


    } catch (erro) {

        console.error(erro);

        alert(
            "Não foi possível carregar os medicamentos."
        );

    }
}


/* =========================
   MOSTRAR PRODUTOS
========================= */

function mostrarProdutos(lista = produtos) {

    const container =
        document.getElementById(
            "produtos"
        );


    container.innerHTML = "";


    document.getElementById(
        "contadorMedicamentos"
    ).textContent =
        `${lista.length} medicamento(s)`;


    lista.forEach(produto => {

        let classeEstoque;


        if (produto.estoque > 25) {

            classeEstoque =
                "estoque-normal";

        } else if (produto.estoque >= 15) {

            classeEstoque =
                "estoque-amarelo";

        } else {

            classeEstoque =
                "estoque-vermelho";

        }


        const div =
            document.createElement("div");


        div.className =
            "produto";


        div.innerHTML = `

            <div class="imagem">
                ${produto.imagem || "💊"}
            </div>


            <h3>
                ${produto.nome}
            </h3>


            ${
                produto.dose
                ? `
                    <p class="dose">
                        Quantidade: ${produto.dose}
                    </p>
                  `
                : ""
            }


            ${
                produto.horario
                ? `
                    <p class="horario">
                        Horário: ${produto.horario}
                    </p>
                  `
                : ""
            }


            ${
                produto.observacao
                ? `
                    <p class="observacao">
                        ${produto.observacao}
                    </p>
                  `
                : ""
            }


            <p class="estoque ${classeEstoque}">

                Estoque:
                ${produto.estoque}
                unidades

            </p>


            <button
                class="adicionar"
                onclick="abrirModal(${produto.id})"
                ${produto.estoque === 0
                    ? "disabled"
                    : ""
                }>

                ${
                    produto.estoque === 0
                    ? "Esgotado"
                    : "Retirar medicamento"
                }

            </button>

        `;


        container.appendChild(div);

    });

}


/* =========================
   ABRIR MODAL
========================= */

function abrirModal(id) {

    const produto =
        produtos.find(
            p => p.id === id
        );


    if (!produto) {
        return;
    }


    if (produto.estoque <= 0) {

        alert(
            "Esse medicamento está esgotado."
        );

        return;
    }


    produtoEscolhido =
        produto;


    let informacoes =
        `Medicamento: ${produto.nome}`;


    if (produto.dose) {

        informacoes +=
            `\nQuantidade da dose: ${produto.dose}`;

    }


    if (produto.horario) {

        informacoes +=
            `\nHorário: ${produto.horario}`;

    }


    informacoes +=
        `\nEstoque disponível: ${produto.estoque}`;


    document.getElementById(
        "produtoSelecionado"
    ).textContent =
        informacoes;


    document.getElementById(
        "nome"
    ).value =
        usuarioAtual;


    document.getElementById(
        "quantidade"
    ).value =
        "1";


    document.getElementById(
        "modal"
    ).style.display =
        "flex";

}


/* =========================
   FECHAR MODAL
========================= */

function fecharModal() {

    document.getElementById(
        "modal"
    ).style.display =
        "none";


    produtoEscolhido =
        null;

}


/* =========================
   CONFIRMAR RETIRADA
========================= */

async function confirmarRetirada() {

    if (!produtoEscolhido) {
        return;
    }


    if (!usuarioAtual) {

        alert(
            "Nenhum usuário selecionado."
        );

        return;
    }


    const quantidade =
        Number(
            document.getElementById(
                "quantidade"
            ).value
        );


    if (
        quantidade !== 1 &&
        quantidade !== 5 &&
        quantidade !== 15 &&
        quantidade !== 20
    ) {

        alert(
            "Escolha uma quantidade válida."
        );

        return;
    }


    if (
        quantidade >
        produtoEscolhido.estoque
    ) {

        alert(
            `Estoque disponível: ${produtoEscolhido.estoque}`
        );

        return;
    }


    try {

        /*
         * A retirada é feita dentro
         * de uma função PostgreSQL.
         *
         * Isso baixa o estoque e
         * registra o histórico juntos.
         */

        const {
            data,
            error
        } = await db.rpc(
            "retirar_medicamento",
            {
                p_medicamento_id:
                    produtoEscolhido.id,

                p_usuario:
                    usuarioAtual,

                p_quantidade:
                    quantidade
            }
        );


        if (error) {
            throw error;
        }


        alert(
            `${usuarioAtual} retirou ${quantidade} unidade(s) de ${produtoEscolhido.nome}.`
        );


        fecharModal();


        await carregarMedicamentos();


    } catch (erro) {

        console.error(erro);


        alert(
            erro.message ||
            "Não foi possível registrar a retirada."
        );

    }

}


/* =========================
   FILTRO
========================= */

function filtrarMedicamentos() {

    const pesquisa =
        document
            .getElementById("pesquisa")
            .value
            .toLowerCase();


    const filtro =
        document
            .getElementById("filtroEstoque")
            .value;


    const resultado =
        produtos.filter(produto => {

            const nome =
                produto.nome
                    .toLowerCase();


            const correspondeNome =
                nome.includes(pesquisa);


            let correspondeEstoque =
                true;


            if (filtro === "normal") {

                correspondeEstoque =
                    produto.estoque > 25;

            }


            if (filtro === "baixo") {

                correspondeEstoque =
                    produto.estoque > 0 &&
                    produto.estoque <= 25;

            }


            if (filtro === "esgotado") {

                correspondeEstoque =
                    produto.estoque === 0;

            }


            return (
                correspondeNome &&
                correspondeEstoque
            );

        });


    mostrarProdutos(resultado);

}


/* =========================
   DASHBOARD
========================= */

function atualizarDashboard() {

    const total =
        produtos.length;


    const estoque =
        produtos.reduce(
            (total, produto) =>
                total + Number(produto.estoque),
            0
        );


    const baixo =
        produtos.filter(
            produto =>
                produto.estoque <= 25
        ).length;


    document.getElementById(
        "totalMedicamentos"
    ).textContent =
        total;


    document.getElementById(
        "totalEstoque"
    ).textContent =
        estoque;


    document.getElementById(
        "estoqueBaixo"
    ).textContent =
        baixo;


    carregarQuantidadeRetiradas();

}


/* =========================
   QUANTIDADE DE RETIRADAS
========================= */

async function carregarQuantidadeRetiradas() {

    try {

        const {
            count,
            error
        } = await db
            .from("retiradas")
            .select(
                "*",
                {
                    count: "exact",
                    head: true
                }
            );


        if (error) {
            throw error;
        }


        document.getElementById(
            "totalRetiradas"
        ).textContent =
            count || 0;


    } catch (erro) {

        console.error(erro);

    }

}


/* =========================
   HISTÓRICO
========================= */

async function abrirHistorico() {

    document.getElementById(
        "modalHistorico"
    ).style.display =
        "flex";


    await carregarHistorico();

}


function fecharHistorico() {

    document.getElementById(
        "modalHistorico"
    ).style.display =
        "none";

}


async function carregarHistorico() {

    const filtro =
        document.getElementById(
            "filtroUsuarioHistorico"
        ).value;


    try {

        let consulta =
            db
                .from("retiradas")
                .select("*")
                .order(
                    "data_hora",
                    {
                        ascending: false
                    }
                );


        if (filtro !== "todos") {

            consulta =
                consulta.eq(
                    "usuario",
                    filtro
                );

        }


        const {
            data,
            error
        } = await consulta;


        if (error) {
            throw error;
        }


        const retiradas =
            data || [];


        const container =
            document.getElementById(
                "listaHistorico"
            );


        container.innerHTML = "";


        if (
            retiradas.length === 0
        ) {

            container.innerHTML =
                "<p>Nenhuma retirada encontrada.</p>";

            return;

        }


        retiradas.forEach(
            retirada => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "item-historico";


                const data =
                    new Date(
                        retirada.data_hora
                    );


                div.innerHTML = `

                    <strong>
                        ${retirada.usuario}
                    </strong>

                    <div>
                        ${retirada.medicamento_nome}
                    </div>

                    <span>

                        ${retirada.quantidade}
                        unidade(s)

                        —

                        ${data.toLocaleDateString(
                            "pt-BR"
                        )}

                        às

                        ${data.toLocaleTimeString(
                            "pt-BR",
                            {
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        )}

                    </span>

                `;


                container.appendChild(div);

            }
        );


    } catch (erro) {

        console.error(erro);

        document.getElementById(
            "listaHistorico"
        ).innerHTML =
            "<p>Erro ao carregar histórico.</p>";

    }

}


/* =========================
   INICIALIZAÇÃO
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        mostrarUsuarios();


        const usuarioSalvo =
            localStorage.getItem(
                "usuarioAtual"
            );


        if (
            usuarioSalvo &&
            usuarios.includes(
                usuarioSalvo
            )
        ) {

            entrar(usuarioSalvo);

        }

    }
);