document.addEventListener('DOMContentLoaded', () => {
    const formRescisao = document.getElementById('form-rescisao');
    const formFgts = document.getElementById('form-fgts');

    formRescisao.addEventListener('submit', (e) => {
        e.preventDefault();
        calcularRescisao();
    });

    formFgts.addEventListener('submit', (e) => {
        e.preventDefault();
        calcularFgtsSimples();
    });
});

function calcularRescisao() {
    // Pegar valores
    const admissao = new Date(document.getElementById('admissao').value);
    const desligamento = new Date(document.getElementById('desligamento').value);
    const salario = parseFloat(document.getElementById('salario').value);
    const motivo = document.getElementById('motivo').value;
    const aviso = document.getElementById('aviso').value;
    const temFeriasVencidas = document.getElementById('ferias-vencidas').value === 'sim';
    const querFgts = document.getElementById('tem-fgts').value === 'sim';

    if (desligamento <= admissao) {
        alert("A data de desligamento deve ser posterior à admissão.");
        return;
    }

    // Cálculos de tempo
    const diffTime = Math.abs(desligamento - admissao);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const anosCompletos = Math.floor(diffDays / 365);
    
    // 1. Saldo de Salário
    const diaDesligamento = desligamento.getDate();
    const saldoSalario = (salario / 30) * diaDesligamento;

    // 2. 13º Proporcional
    // Considera meses do ano atual
    const mesDesligamento = desligamento.getMonth() + 1;
    let meses13 = diaDesligamento >= 15 ? mesDesligamento : mesDesligamento - 1;
    if (desligamento.getFullYear() > admissao.getFullYear() && admissao.getMonth() > 0) {
        // Se entrou no meio do ano anterior, mas saiu este ano
    }
    // Simplificado para o ano corrente
    const decimoTerceiro = (salario / 12) * meses13;

    // 3. Férias Proporcionais
    // Cálculo simplificado de avos (meses trabalhados no total % 12)
    const mesesTrabalhadosTotal = Math.floor(diffDays / 30.44);
    const avosFerias = mesesTrabalhadosTotal % 12;
    const feriasProp = (salario / 12) * avosFerias;
    const tercoConstitucional = (feriasProp + (temFeriasVencidas ? salario : 0)) / 3;

    // 4. Férias Vencidas
    const valorFeriasVencidas = temFeriasVencidas ? salario : 0;

    // 5. Aviso Prévio (Lei 12.506/2011)
    let valorAviso = 0;
    if (aviso === 'indenizado') {
        const diasAviso = 30 + (anosCompletos * 3);
        const diasAvisoLimitado = Math.min(diasAviso, 90);
        valorAviso = (salario / 30) * diasAvisoLimitado;
    }

    // 6. FGTS e Multa
    let fgtsEstimado = 0;
    let multaFgts = 0;
    if (querFgts) {
        fgtsEstimado = (salario * 0.08) * mesesTrabalhadosTotal;
        if (motivo === 'sem-justa-causa') {
            multaFgts = fgtsEstimado * 0.40;
        }
    }

    // Aplicar Regras por Tipo de Motivo
    let total = saldoSalario + feriasProp + tercoConstitucional + valorFeriasVencidas;
    
    if (motivo !== 'justa-causa') {
        total += decimoTerceiro;
    }
    
    if (motivo === 'sem-justa-causa') {
        total += valorAviso + multaFgts;
    } else if (motivo === 'pedido-demissao' || motivo === 'justa-causa') {
        valorAviso = 0;
        multaFgts = 0;
    }

    // Exibir Resultados
    document.getElementById('res-saldo-salario').innerText = formatarMoeda(saldoSalario);
    document.getElementById('res-13-prop').innerText = motivo === 'justa-causa' ? "R$ 0,00" : formatarMoeda(decimoTerceiro);
    document.getElementById('res-ferias-prop').innerText = formatarMoeda(feriasProp);
    document.getElementById('res-terco').innerText = formatarMoeda(tercoConstitucional);
    document.getElementById('res-ferias-vencidas').innerText = formatarMoeda(valorFeriasVencidas);
    document.getElementById('res-aviso').innerText = formatarMoeda(valorAviso);
    document.getElementById('res-fgts').innerText = formatarMoeda(fgtsEstimado);
    document.getElementById('res-multa').innerText = formatarMoeda(multaFgts);
    document.getElementById('res-total').innerText = formatarMoeda(total);

    document.getElementById('resultado-rescisao').classList.remove('hidden');
    document.getElementById('resultado-rescisao').scrollIntoView({ behavior: 'smooth' });
}

function calcularFgtsSimples() {
    const salario = parseFloat(document.getElementById('fgts-salario').value);
    const meses = parseInt(document.getElementById('fgts-meses').value);
    const total = (salario * 0.08) * meses;

    document.getElementById('fgts-total-val').innerText = formatarMoeda(total);
    document.getElementById('resultado-fgts').classList.remove('hidden');
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function resetarCalculo() {
    document.getElementById('form-rescisao').reset();
    document.getElementById('resultado-rescisao').classList.add('hidden');
    window.scrollTo(0, 0);
}

function copiarResultado() {
    const saldo = document.getElementById('res-saldo-salario').innerText;
    const decimo = document.getElementById('res-13-prop').innerText;
    const feriasP = document.getElementById('res-ferias-prop').innerText;
    const terco = document.getElementById('res-terco').innerText;
    const feriasV = document.getElementById('res-ferias-vencidas').innerText;
    const aviso = document.getElementById('res-aviso').innerText;
    const fgts = document.getElementById('res-fgts').innerText;
    const multa = document.getElementById('res-multa').innerText;
    const total = document.getElementById('res-total').innerText;

    const texto = `CALCULADORA DE RESCISÃO CLT 2026
----------------------------------
Saldo de salário: ${saldo}
13º proporcional: ${decimo}
Férias proporcionais: ${feriasP}
1/3 constitucional: ${terco}
Férias vencidas: ${feriasV}
Aviso prévio: ${aviso}
FGTS estimado: ${fgts}
Multa FGTS: ${multa}
----------------------------------
TOTAL ESTIMADO: ${total}`;

    navigator.clipboard.writeText(texto).then(() => {
        alert("Resultado copiado para a área de transferência!");
    });
}
