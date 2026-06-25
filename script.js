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

/**
 * CONTA AVOS DE 13º SALÁRIO (Calendário Civil: Janeiro a Dezembro)
 * Regra: Fração igual ou superior a 15 dias dentro do mesmo mês civil.
 */
function calcularAvosDecimo(admissao, desligamento) {
    let avos = 0;
    const anoRescisao = desligamento.getFullYear();
    
    const mesInicio = (admissao.getFullYear() === anoRescisao) ? admissao.getMonth() : 0;
    const mesFim = desligamento.getMonth();

    for (let mes = mesInicio; mes <= mesFim; mes++) {
        let diasTrabalhadosNoMes = 0;

        if (mes === mesInicio && admissao.getFullYear() === anoRescisao) {
            const ultimoDiaDoMes = new Date(anoRescisao, mes + 1, 0).getDate();
            diasTrabalhadosNoMes = ultimoDiaDoMes - admissao.getDate() + 1;
        }
        else if (mes === mesFim) {
            diasTrabalhadosNoMes = desligamento.getDate();
        }
        else {
            diasTrabalhadosNoMes = 30; 
        }

        if (diasTrabalhadosNoMes >= 15) {
            avos++;
        }
    }
    return Math.min(12, avos);
}

/**
 * CONTA AVOS DE FÉRIAS PROPORCIONAIS (Meses Contratuais / Período Aquisitivo)
 * Regra: Conta de data a data. Fração >= 15 dias gera 1 avo.
 */
function calcularAvosFerias(admissao, desligamento) {
    let avos = 0;
    let dataAniversario = new Date(admissao.getTime());
    
    while (true) {
        let proximoAniversario = new Date(dataAniversario.getFullYear(), dataAniversario.getMonth() + 1, admissao.getDate());
        
        if (proximoAniversario.getDate() !== admissao.getDate()) {
            proximoAniversario = new Date(dataAniversario.getFullYear(), dataAniversario.getMonth() + 1, 0);
        }

        if (proximoAniversario > desligamento) {
            const diffTime = Math.abs(desligamento - dataAniversario);
            const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diasRestantes >= 15) {
                avos++;
            }
            break;
        }

        avos++;
        dataAniversario = proximoAniversario;
    }

    return avos % 12; 
}

/**
 * CONTA OS MESES TOTAIS TRABALHADOS PARA EFEITO DE FGTS ACUMULADO
 */
function calcularMesesTotaisTrabalhados(admissao, desligamento) {
    let meses = 0;
    let dataAniversario = new Date(admissao.getTime());

    while (true) {
        let proximoAniversario = new Date(dataAniversario.getFullYear(), dataAniversario.getMonth() + 1, admissao.getDate());
        if (proximoAniversario.getDate() !== admissao.getDate()) {
            proximoAniversario = new Date(dataAniversario.getFullYear(), dataAniversario.getMonth() + 1, 0);
        }

        if (proximoAniversario > desligamento) {
            const diffTime = Math.abs(desligamento - dataAniversario);
            const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diasRestantes >= 15) {
                meses++;
            }
            break;
        }

        meses++;
        dataAniversario = proximoAniversario;
    }
    return meses;
}

/**
 * CALCULA OS DIAS DE AVISO PRÉVIO PROPORCIONAL (Lei 12.506/2011)
 */
function calcularDiasAvisoPrevio(admissao, desligamento) {
    const diffTime = Math.abs(desligamento - admissao);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const anosCompletos = Math.floor(diffDays / 365);
    
    return Math.min(90, 30 + (anosCompletos * 3));
}

function calcularRescisao() {
    // 1. Validação das Datas (Prevenção de campos vazios)
    const admissaoInput = document.getElementById('admissao').value;
    const desligamentoInput = document.getElementById('desligamento').value;

    if (!admissaoInput || !desligamentoInput) {
        alert("Por favor, preencha as datas de admissão e desligamento.");
        return;
    }

    const admissao = new Date(admissaoInput);
    const desligamento = new Date(desligamentoInput);

    if (isNaN(admissao.getTime()) || isNaN(desligamento.getTime())) {
        alert("Formato de data inválido. Por favor, verifique os campos.");
        return;
    }

    if (desligamento <= admissao) {
        alert("A data de desligamento deve ser posterior à admissão.");
        return;
    }

    // 2. Validação do Salário
    const salarioInput = document.getElementById('salario').value;
    const salario = parseFloat(salarioInput);

    if (isNaN(salario) || salario <= 0) {
        alert("Por favor, insira um valor de salário válido e maior que zero.");
        return;
    }

    // Pegar demais valores do DOM
    const motivo = document.getElementById('motivo').value;
    const aviso = document.getElementById('aviso').value;
    const temFeriasVencidas = document.getElementById('ferias-vencidas').value === 'sim';
    const querFgts = document.getElementById('tem-fgts').value === 'sim';

    // AJUSTE ALTA PRIORIDADE: Saldo de Salário calculado sobre base comercial padrão de 30 dias
    const diaDesligamento = desligamento.getDate();
    const saldoSalario = (salario / 30) * diaDesligamento;

    // 13º Proporcional
    const avos13 = (motivo !== 'justa-causa') ? calcularAvosDecimo(admissao, desligamento) : 0;
    const decimoTerceiro = (salario / 12) * avos13;

    // Férias Proporcionais
    const avosFerias = (motivo !== 'justa-causa') ? calcularAvosFerias(admissao, desligamento) : 0;
    const feriasProp = (salario / 12) * avosFerias;

    // Férias Vencidas
    const valorFeriasVencidas = temFeriasVencidas ? salario : 0;

    // Terço Constitucional
    const tercoConstitucional = (feriasProp + valorFeriasVencidas) / 3;

    // Aviso Prévio Indenizado
    let valorAviso = 0;
    if (aviso === 'indenizado' && motivo === 'sem-justa-causa') {
        const diasAviso = calcularDiasAvisoPrevio(admissao, desligamento);
        valorAviso = (salario / 30) * diasAviso;
    }

    // FGTS e Multa Rescisória
    let fgtsEstimado = 0;
    let multaFgts = 0;
    const mesesTrabalhadosTotal = calcularMesesTotaisTrabalhados(admissao, desligamento);

    if (querFgts) {
        fgtsEstimado = (salario * 0.08) * mesesTrabalhadosTotal;
        if (motivo === 'sem-justa-causa') {
            multaFgts = fgtsEstimado * 0.40;
        }
    }

    // Somatória Final
    const total = saldoSalario + decimoTerceiro + feriasProp + valorFeriasVencidas + tercoConstitucional + valorAviso + multaFgts;

    // Injetar Resultados no HTML
    document.getElementById('res-saldo-salario').innerText = formatarMoeda(saldoSalario);
    document.getElementById('res-13-prop').innerText = formatarMoeda(decimoTerceiro);
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
    const salarioInput = document.getElementById('fgts-salario').value;
    const mesesInput = document.getElementById('fgts-meses').value;
    
    const salario = parseFloat(salarioInput);
    const meses = parseInt(mesesInput);

    if (isNaN(salario) || salario <= 0 || isNaN(meses) || meses <= 0) {
        alert("Por favor, insira valores válidos para o cálculo do FGTS.");
        return;
    }

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

    const texto = `CALCULADORA DE RESCISÃO CLT 2026\n----------------------------------\nSaldo de salário: ${saldo}\n13º proporcional: ${decimo}\nFérias proporcionais: ${feriasP}\n1/3 constitucional: ${terco}\nFérias vencidas: ${feriasV}\nAviso prévio: ${aviso}\nFGTS estimado: ${fgts}\nMulta FGTS: ${multa}\n----------------------------------\nTOTAL ESTIMADO: ${total}`;

    navigator.clipboard.writeText(texto).then(() => {
        alert("Resultado copiado para a área de transferência!");
    });
}
