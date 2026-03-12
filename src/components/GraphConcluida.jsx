import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import "../App.css";
import { useCurriculo } from "../context/useDataContext";
import ModalSubjects from "./ModalSubjects";

const normalizar = (txt) =>
  txt?.toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "")
    .trim();

export default function GraphConcluida() {
  const [graphVersion, setGraphVersion] = useState(0);
  const [ocultarConcluidasNoGrafo, setOcultarConcluidasNoGrafo] = useState(false);
  const toggleOcultarConcluidasNoGrafo = () =>
    setOcultarConcluidasNoGrafo(v => !v);
  const cyMetricRef = useRef(null);
  const { history, curriculo, filtros } = useCurriculo();

  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [subjectCompleted, setSubjectCompleted] = useState([]);

  const [pendent, setPendant] = useState([]);

  const [showSubjectCompleted, setShowSubjectCompleted] = useState(false);
  const [showSubjectPendant, setShowSubjecPendant] = useState(false);

  function onCloseModal() {
    setModalAberto(false);
    console.log("cliquei", modalAberto);
  }
  function setShowFilterCompleted() {
    setShowSubjectCompleted(!showSubjectCompleted);
  }

  function setShowFilterPendant() {
    setShowSubjecPendant(!showSubjectPendant);
    console.log("cliquei");
  }

  const cyRef = useRef(null);
  const cyInstance = useRef(null); // Ref para permitir que o efeito de filtros acesse o grafo

  function buildHeadlessCyFrom(cy, reverseEdges = false) {
    const nodes = cy.nodes().filter(n => !n.data("isHeader")).map(n => ({ data: { ...n.data() } }));
    const nodeIds = new Set(nodes.map(n => n.data.id));

    const edges = [];

    cy.edges().forEach(e => {
      const s = e.data("source");
      const t = e.data("target");

      const source = reverseEdges ? t : s;
      const target = reverseEdges ? s : t;

      // ✅ filtro forte: só entra se ambos existem
      if (!nodeIds.has(source) || !nodeIds.has(target)) return;

      edges.push({
        data: {
          id: `M:${e.id()}`,
          source,
          target,
        }
      });
    });

    return cytoscape({
      headless: true,
      elements: [...nodes, ...edges],
    });
  }

  useEffect(() => {
    if (!cyInstance.current) return;
    const cy = cyInstance.current;
    const cyM = cyMetricRef.current;

    // ainda não inicializou o grafo
    if (!cy || !cyM) return;

    // reset
    cy.nodes().removeData("rank");
    cy.data("maxRank", 0);

    const setRankOnView = (nodeId, value) => {
      const n = cy.getElementById(nodeId);
      if (n && n.length) n.data("rank", value);
    };

    switch (filtros) {
      case "gargalos": {
        const pr = cy.elements().pageRank({ dampingFactor: 0.8 });

        let max = 0;
        cy.nodes().forEach(n => {
          const r = pr.rank(n);
          n.data("rank", r);
          if (r > max) max = r;
        });

        cy.data("maxRank", max || 1);
        break;
      }

      case "desbloqueio": {
        let maxDeg = 0;

        cyM.nodes().forEach(n => {
          const d = n.outdegree();
          setRankOnView(n.id(), d);
          if (d > maxDeg) maxDeg = d;
        });

        cy.data("maxRank", maxDeg || 1);
        break;
      }

      case "pontes": {
        const bc = cyM.elements().betweennessCentrality({
          directed: true,
          normalized: true,
        });

        let maxBC = 0;

        cyM.nodes().forEach(n => {
          let val = bc.betweenness(n);
          if (!Number.isFinite(val) || Number.isNaN(val)) val = 0;

          setRankOnView(n.id(), val);
          if (val > maxBC) maxBC = val;
        });

        cy.data("maxRank", maxBC || 1);
        break;
      }

      case "nucleo": {
        const ccn = cyM.elements().closenessCentralityNormalized({
          directed: false,  // mais estável/interpretável em currículo
          harmonic: true,
        });

        let maxCC = 0;

        cyM.nodes().forEach(n => {
          let val = ccn.closeness(n);
          if (!Number.isFinite(val) || Number.isNaN(val)) val = 0;

          setRankOnView(n.id(), val);
          if (val > maxCC) maxCC = val;
        });

        cy.data("maxRank", maxCC || 1);
        break;
      }

      default:
        break;
    }

    cy.nodes().removeData("isImportant");

    let best = null;
    let bestRank = -Infinity;

    cy.nodes().forEach(n => {
      if (n.data("isHeader")) return;
      if (n.hidden && n.hidden()) return;
      if (n.hasClass("concluida") || n.data("concluida") === true) return;
      if (!(n.hasClass("disponivel") || n.data("disponivel") === true)) return;

      const r = Number.isFinite(n.data("rank")) ? n.data("rank") : 0;

      if (r > bestRank) {
        bestRank = r;
        best = n;
      }
    });

    if (best) best.data("isImportant", true);
    cy.style().update();
  }, [filtros, graphVersion]);

  useEffect(() => {
    const cy = cyInstance.current;
    if (!cy) return;

    if (typeof cy.destroyed === "function" && cy.destroyed()) return;

    const done = cy.nodes(".concluida").filter(n => !n.data("isHeader"));
    const doneEdges = done.connectedEdges();

    if (ocultarConcluidasNoGrafo) {
      done.addClass("hiddenDone");
      doneEdges.addClass("hiddenDone");
    } else {
      done.removeClass("hiddenDone");
      doneEdges.removeClass("hiddenDone");
    }

    cy.style().update();
  }, [ocultarConcluidasNoGrafo]);

  useEffect(() => {
    let cy;

    async function inicializarGrafo() {
      try {
        const elementosBrutos = curriculo[0].curriculo[0].matriz_curricular;
        const elementos = elementosBrutos.filter(disc => disc.competencia !== "OPTATIVA");
        const historicoPronto = (history?.codigos?.length ?? 0) > 0 || (history?.nomes?.length ?? 0) > 0;

        const matrizIds = new Set(elementos.map(e => String(e.codigo).trim()));
        const prereqMap = new Map(
          elementos.map(e => [
            String(e.codigo).trim(),
            (e.pre_requisitos || []).map(pr => String(pr).trim())
          ])
        );

        const codigosHistorico = new Set(
          (history?.codigos || []).map(c => c.trim().toUpperCase())
        );
        const nomesHistorico = new Set(
          (history?.nomes || []).map(n => normalizar(n))
        );

        console.log("curricuko", curriculo.disciplina);

        const curriculoComStatus = elementos.map((disc) => {
          const nomeMatrizNormalizado = normalizar(disc.nome);

          const concluida = historicoPronto && (
            codigosHistorico.has(String(disc.codigo).trim().toUpperCase()) ||
            nomesHistorico.has(nomeMatrizNormalizado)
          );

          return { ...disc, concluida };
        });

        console.log("mapeia hisoricoo", Array.from(codigosHistorico));

        const codigosConcluidos = new Set(
          curriculoComStatus.filter(d => d.concluida).map(d => String(d.codigo).trim())
        );

        const nodes = curriculoComStatus.map((disc) => {
          const id = String(disc.codigo).trim();

          const prereqs = (prereqMap.get(id) || []).filter(pr => matrizIds.has(pr));

          const disponivel =
            historicoPronto &&
            !disc.concluida &&
            prereqs.every(pr => codigosConcluidos.has(pr));

          return {
            data: {
              id,
              nome: disc.nome,
              periodo: disc.periodo,
              carga: disc.carga_horaria,
              concluida: disc.concluida,
              disponivel,
              prereqs,
              oldLabel: id,
            },
            classes: `${disc.concluida ? "concluida" : ""} ${disponivel ? "disponivel" : ""}`.trim(),
          };
        });
        const filterSubjectCompleted = curriculoComStatus.filter(
          (f) => f.concluida
        );
        console.log(
          filterSubjectCompleted
        );
        setSubjectCompleted(filterSubjectCompleted);

        const filterSubjectPendant = curriculoComStatus.filter(
          (f) => f.concluida === false
        );
        setPendant(filterSubjectPendant);
        console.log("nodes mapeados com concluido", nodes);
        const nodeIds = new Set(nodes.map(n => n.data.id));
        const edges = [];

        elementos.forEach((element) => {
          element.pre_requisitos.forEach((pr) => {
            if (!nodeIds.has(pr)) return;
            edges.push({
              data: {
                id: `${element.codigo}->${pr}`,
                source: element.codigo,
                target: pr,
              },
            });
          });
        });

        const periodos = Array.from(
          new Set(nodes.map(n => Number(n.data.periodo) || 0))
        ).sort((a, b) => a - b);

        const headerNodes = periodos
          .filter(p => p > 0)
          .map(p => ({
            data: {
              id: `PERIODO_${p}`,
              label: `Período ${p}`,
              periodo: p,
              isHeader: true,
            },
            classes: "periodHeader",
          }));

        cy = cytoscape({
          container: cyRef.current,
          elements: [...headerNodes, ...nodes, ...edges],
          autoungrabify: true,
          userPanningEnabled: false,
          userZoomingEnabled: false,
          style: [
            {
              selector: "node",
              style: {
                label: "data(id)",
                "background-color": "#2563eb", // azul melhor (blue-600)
                color: "#ffffff",
                "text-valign": "center",
                width: 200,
                height: 50,
                "font-size": "15px",
                shape: "round-rectangle",

                "background-image": (node) => {
                  const rank = node.data("rank");
                  const max = node.cy().data("maxRank") || 1;

                  let safeRank = Number.isFinite(rank) ? rank : 0;
                  let safeMax = Number.isFinite(max) && max > 0 ? max : 1;

                  let ratio = safeRank / safeMax;
                  ratio = Math.max(0, Math.min(1, ratio));

                  const ratioMin = Math.max(ratio, 0.08);

                  const hue = 220 - 220 * ratioMin;
                  const color = `hsl(${hue}, 90%, 55%)`;

                  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
        <circle cx="5" cy="5" r="4.5" fill="${color}" stroke="white" stroke-width="0.5"/>
      </svg>`;

                  return `data:image/svg+xml;base64,${btoa(svg)}`;
                },

                "background-width": "14px",
                "background-height": "14px",
                "background-position-x": "180px",
                "background-position-y": "5px",
                "background-clip": "node",
                "z-index": 10,
              },
            },
            {
              selector: "node.highlighted",
              style: {
                width: 210,
                "background-color": "#3b82f6", // azul mais claro no hover
                opacity: 0.95,
                "z-index": 999,
                "text-wrap": "wrap",
                "text-max-width": "150px",

                "background-image": (node) => {
                  const rank = node.data("rank");
                  const max = node.cy().data("maxRank") || 1;

                  let safeRank = Number.isFinite(rank) ? rank : 0;
                  let safeMax = Number.isFinite(max) && max > 0 ? max : 1;

                  let ratio = safeRank / safeMax;
                  ratio = Math.max(0, Math.min(1, ratio));

                  const ratioMin = Math.max(ratio, 0.08);

                  const hue = 220 - 220 * ratioMin;
                  const color = `hsl(${hue}, 90%, 55%)`;

                  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
        <circle cx="5" cy="5" r="4.5" fill="${color}" stroke="white" stroke-width="0.5"/>
      </svg>`;

                  return `data:image/svg+xml;base64,${btoa(svg)}`;
                },

                "background-width": "14px",
                "background-height": "14px",
                "background-position-x": "180px",
                "font-size": "13px",
              },
            },
            {
              selector: "node.concluida",
              style: {
                "background-color": "#22c55e", // green-500
                color: "#052e16",
                "font-weight": "700",
                "border-width": 0,
              },
            },
            {
              selector: "edge",
              style: {
                "curve-style": "bezier",
                "target-arrow-shape": "triangle",
              },
            },
            { selector: "node.faded", style: { opacity: 0.3 } },
            { selector: "edge.faded", style: { opacity: 0.1 } },
            {
              selector: "edge.highlighted",
              style: {
                "curve-style": "bezier",
                "target-arrow-shape": "triangle",
                width: 4,
                "background-color": "#FF851B",
                "line-color": "#FF855F",
                "target-arrow-color": "#FF855F",
                "z-index": "50",
              },
            },
            {
              selector: "node.disponivel",
              style: {
                "border-width": 3,
                "border-color": "#22c55e",
              },
            },
            {
              selector: "node.periodHeader",
              style: {
                label: "data(label)",
                "background-color": "rgba(255,255,255,0.92)",
                color: "#0f172a",
                "font-size": 14,
                "font-weight": "700",
                width: 200,
                height: 32,
                shape: "round-rectangle",
                "text-valign": "center",
                "text-halign": "center",
                "border-width": 1,
                "border-color": "rgba(15,23,42,0.15)",
                "background-image": "none",
                "z-index": 9999,
              },
            },
            {
              selector: "node.periodHeader.faded",
              style: { opacity: 1 }, // pra não sumir no hover/fade
            },
            {
              selector: "node.hiddenDone",
              style: { display: "none" },
            },
            {
              selector: "edge.hiddenDone",
              style: { display: "none" },
            },
            {
              selector: "node.disponivel[?isImportant]",
              style: {
                "border-width": 5,
                "border-color": "#f59e0b",
                "shadow-blur": 12,
                "shadow-opacity": 0.25,
                "shadow-color": "#f59e0b",
                "shadow-offset-x": 0,
                "shadow-offset-y": 0,
              }
            },
          ],
        });

        cyInstance.current = cy; // Salva a instância para o efeito de filtros
        cyMetricRef.current?.destroy();
        cyMetricRef.current = buildHeadlessCyFrom(cy, true);

        setGraphVersion(v => v + 1);
        const contagemDeLinhas = {};
        const headerY = 0;
        const baseY = 45;

        cy.layout({
          name: "preset",
          positions: (node) => {
            const p = Number(node.data("periodo")) || 0;

            if (node.data("isHeader")) {
              return { x: p * 230, y: headerY };
            }

            if (contagemDeLinhas[p] === undefined) contagemDeLinhas[p] = 0;
            const linha = contagemDeLinhas[p]++;

            return {
              x: p * 230,
              y: baseY + linha * 55,
            };
          },
        }).run();

        cy.on("mouseover", "node", (evt) => {
          const node = evt.target;
          if (node.data("isHeader")) return;
          node.data("oldLabel", node.data("id"));
          node.data("label", node.data("nome"));
          node.style("label", node.data("label"));

          const connected = node
            .successors()
            .union(node.predecessors())
            .union(node);
          cy.elements().difference(connected).addClass("faded");
          connected.removeClass("faded").addClass("highlighted");
        });

        cy.on("mouseout", "node", (evt) => {
          const node = evt.target;
          if (node.data("isHeader")) return;
          node.data("label", node.data("oldLabel"));
          node.style("label", node.data("label"));

          cy.elements().removeClass("faded highlighted");
        });

        cy.on("tap", "node", (evt) => {
          const node = evt.target;
          if (node.data("isHeader")) return;
          setDisciplinaSelecionada({
            codigo: node.data("id"),
            nome: node.data("nome"),
            periodo: node.data("periodo"),
            carga: node.data("carga"),
            concluida: node.data("concluida"),
          });

          setModalAberto(true);
        });

      } catch (e) {
        console.error(e);
        if (cyRef.current) {
          cyRef.current.innerText =
            "Erro ao carregar o grafo. Verifique o console.";
        }
      }
    }

    inicializarGrafo();

    return () => {
      cyMetricRef.current?.destroy?.();
      cyMetricRef.current = null;

      cyInstance.current?.destroy?.();
      cyInstance.current = null;
    };
  }, [curriculo, history]);

  return (
    <div className="relative w-full h-full">
      <div id="cy" ref={cyRef} />
      {modalAberto && (
        <ModalSubjects
          disciplina={disciplinaSelecionada}
          onCloseModal={onCloseModal}
        />
      )}

      {/* DOCK ÚNICO: Painéis + Legenda (responsivo) */}
      <div className="fixed bottom-4 left-4 right-4 z-[90] flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between pointer-events-none">
        {/* Painel esquerdo (botões + listas) */}
        <div className="flex flex-col gap-2 max-w-[min(90vw,28rem)] pointer-events-auto">
          {/* Concluídas */}
          <div className="flex flex-col gap-3">
            <button
              className="bg-slate-800 text-white px-4 py-2 rounded shadow-lg hover:bg-slate-900 transition-colors text-sm font-bold"
              onClick={toggleOcultarConcluidasNoGrafo}
            >
              {ocultarConcluidasNoGrafo ? "Mostrar Concluídas no Grafo" : "Ocultar Concluídas no Grafo"}
            </button>

            <button
              className="bg-blue-500 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-600 transition-colors text-sm font-bold"
              onClick={setShowFilterCompleted}
            >
              {showSubjectCompleted ? "Ocultar Concluídas" : "Ver Concluídas"}
            </button>

            {showSubjectCompleted && (
              <div className="bg-white/90 mt-1 max-h-48 overflow-y-auto p-2 rounded shadow-inner text-black text-xs">
                {subjectCompleted.length > 0 ? (
                  subjectCompleted.map((item) => (
                    <div key={item.codigo} className="border-b py-1">
                      {item.codigo} - {item.nome}
                    </div>
                  ))
                ) : (
                  <p>Nenhuma concluída.</p>
                )}
              </div>
            )}
          </div>

          {/* Pendentes */}
          <div className="flex flex-col">
            <button
              className="bg-red-600 text-white px-4 py-2 rounded shadow-lg hover:bg-red-700 transition-colors text-sm font-bold"
              onClick={setShowFilterPendant}
            >
              {showSubjectPendant ? "Ocultar Pendentes" : "Ver Pendentes"}
            </button>

            {showSubjectPendant && (
              <div className="bg-white/90 mt-1 max-h-48 overflow-y-auto p-2 rounded shadow-inner text-black text-xs">
                {pendent.length > 0 ? (
                  pendent.map((item) => (
                    <div key={item.codigo} className="border-b py-1">
                      {item.codigo} - {item.nome}
                    </div>
                  ))
                ) : (
                  <p>Tudo concluído!</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Legenda (direita no desktop / abaixo no mobile) */}
        <div className="pointer-events-auto self-end sm:self-auto flex flex-col gap-2">
          {/* Intensidade */}
          <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-lg text-xs text-gray-800 w-[min(18rem,calc(100vw-2rem))] sm:w-72">
            <div className="font-semibold mb-1">Legenda – Intensidade</div>

            <div className="text-[11px] text-gray-600 mb-2">
              Filtro:{" "}
              <span className="font-medium text-gray-800">
                {filtros === "padrao" ? "Padrão" :
                  filtros === "gargalos" ? "Influência (PageRank)" :
                    filtros === "desbloqueio" ? "Conectividade (Grau)" :
                      filtros === "pontes" ? "Intermediação (Betweenness)" :
                        filtros === "nucleo" ? "Proximidade (Closeness)" :
                          filtros}
              </span>
            </div>

            <div className="flex items-center justify-between mb-1 text-[11px] text-gray-600">
              <span>Baixa</span>
              <span>Alta</span>
            </div>

            <div
              className="h-3 rounded"
              style={{
                background:
                  "linear-gradient(90deg, hsl(220 90% 55%), hsl(160 90% 55%), hsl(100 90% 55%), hsl(40 90% 55%), hsl(0 90% 55%))",
              }}
            />

            <div className="mt-2 text-[11px] leading-snug text-gray-600">
              Quanto mais próximo do vermelho, maior o valor da métrica selecionada.
            </div>
          </div>

          {/* Status */}
          <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-lg text-xs text-gray-800 w-[min(18rem,calc(100vw-2rem))] sm:w-72">
            <div className="font-semibold mb-2">Legenda – Status</div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-8 h-4 rounded-md border border-black/10" style={{ background: "#22c55e" }} />
                <span className="text-[11px] text-gray-700">Concluída</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-block w-8 h-4 rounded-md border-2" style={{ background: "#2563eb", borderColor: "#22c55e" }} />
                <span className="text-[11px] text-gray-700">Disponível (pré-requisitos OK)</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-block w-8 h-4 rounded-md border border-black/15" style={{ background: "#2563eb" }} />
                <span className="text-[11px] text-gray-700">Pendente (faltam pré-requisitos)</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="relative inline-block w-8 h-4 rounded-md border-2" style={{ background: "#2563eb", borderColor: "#f59e0b" }}>
                </span>
                <span className="text-[11px] text-gray-700">Recomendada (maior rank disponível)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}