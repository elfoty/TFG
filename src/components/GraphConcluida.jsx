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
  const { history, curriculo } = useCurriculo();

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

  useEffect(() => {
    let cy;

    async function inicializarGrafo() {
      try {
        const elementosBrutos = curriculo[0].curriculo[0].matriz_curricular;
        const elementos = elementosBrutos.filter(disc => disc.competencia !== "OPTATIVA");

        // --- INSERÇÃO: Mapeamento de Códigos e Nomes do Histórico ---
        const codigosHistorico = new Set(
          (history?.codigos || []).map(c => c.trim().toUpperCase())
        );
        const nomesHistorico = new Set(
          (history?.nomes || []).map(n => normalizar(n))
        );
        // ----------------------------------------------------------

        console.log("curricuko", curriculo.disciplina);

        const curriculoComStatus = elementos.map((disc) => {
          // --- INSERÇÃO: Verificação Dupla (Código OU Nome) ---
          const nomeMatrizNormalizado = normalizar(disc.nome);
          const concluida = 
            codigosHistorico.has(disc.codigo.trim().toUpperCase()) || 
            nomesHistorico.has(nomeMatrizNormalizado);
          // --------------------------------------------------

          return {
            ...disc,
            concluida: concluida,
          };
        });

        console.log("mapeia hisoricoo", Array.from(codigosHistorico));

        const nodes = curriculoComStatus.map((disc) => ({
          data: {
            id: disc.codigo,
            nome: disc.nome,
            periodo: disc.periodo,
            carga: disc.carga_horaria,
            concluida: disc.concluida,
            oldLabel: disc.codigo,
          },
          classes: disc.concluida ? "concluida" : "",
        }));
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
        const edges = [];
        elementos.forEach((element) => {
          element.pre_requisitos.forEach((pr) => {
            edges.push({
              data: {
                id: `${element.codigo}->${pr}`,
                source: element.codigo,
                target: pr,
              },
            });
          });
        });
        console.log("edges", edges);
        cy = cytoscape({
          container: cyRef.current,
          elements: [...nodes, ...edges],
          autoungrabify: true,
          userPanningEnabled: false,
          userZoomingEnabled: false,
          style: [
            {
              selector: "node",
              style: {
                label: "data(id)",
                "background-color": "#193cb8",
                color: "#fff",
                "text-valign": "center",
                width: 200,
                height: 30,
                "font-size": "15px",
                shape: "round-rectangle",

                "background-image": (node) => {
                  const rank = node.data("rank") || 0;
                  const max = node.cy().data("maxRank") || 0.0001;
                  const ratio = rank / max;

                  const r = Math.floor(255 * 1.5 * ratio);
                  const color = `rgb(${r}, 0, 0)`;

                  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><circle cx="5" cy="5" r="4.5" fill="${color}" stroke="white" stroke-width="0.5"/></svg>`;
                  return `data:image/svg+xml;base64,${btoa(svg)}`;
                },
                "background-width": "14px",
                "background-height": "14px",
                "background-position-x": "180px",
                "background-position-y": "5px",
                "background-clip": "node",
                "z-index": 10 
              },
            },
            {
              selector: "node.concluida",
              style: {
                "background-color": "#2ECC40",
                color: "#000",
                "font-weight": "bold",
              },
            },
            {
              selector: "node[?isImportant]",
              style: {
                "background-image": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PGNpcmNsZSBjeD0iNSIgY3k9IjUiIHI9IjUiIGZpbGw9IiNGRjg1MUIiLz48L3N2Zz4=", 
              }
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
              selector: "node.highlighted",
              style: {
                label: "data(id)",
                "text-valign": "center",
                width: 200,
                height: 30,
                "font-size": "15px",
                shape: "round-rectangle",
                'text-max-width': 180,
                "text-overflow-wrap": "ellipsis",
                "background-color": "#193cb8",
                "line-color": "#FF851B",
                opacity: 0.8,
              },
            },
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
          ],
        });

        const pr = cy.elements().pageRank({ dampingFactor: 0.85 });

        let maxRank = 0;
        cy.nodes().forEach(node => {
          const r = pr.rank(node);
          node.data('rank', r);
          if (r > maxRank) maxRank = r;
        });

        cy.data('maxRank', maxRank);
        cy.style().update();

        const contagemDeLinhas = {};

        cy.layout({
          name: "preset",
          positions: (node) => {
            const p = node.data("periodo");
            if (contagemDeLinhas[p] === undefined) contagemDeLinhas[p] = 0;
            const linha = contagemDeLinhas[p]++;
            return {
              x: p * 230,
              y: linha * 40,
            };
          },
        }).run();

        cy.on("mouseover", "node", (evt) => {
          const node = evt.target;

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

          node.data("label", node.data("oldLabel"));
          node.style("label", node.data("label"));

          cy.elements().removeClass("faded highlighted");
        });

        cy.on("tap", "node", (evt) => {
          const node = evt.target;

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
      if (cy) cy.destroy();
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

      <div className="fixed bottom-4 left-4 z-[90] flex flex-col gap-2 max-w-[90vw]">

        <div className="flex flex-col">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded shadow-lg hover:bg-green-700 transition-colors text-sm font-bold"
            onClick={setShowFilterCompleted}
          >
            {showSubjectCompleted ? "Ocultar Concluídas" : "Ver Concluídas"}
          </button>
          {showSubjectCompleted && (
            <div className="bg-white/90 mt-1 max-h-48 overflow-y-auto p-2 rounded shadow-inner text-black text-xs">
              {subjectCompleted.length > 0 ? (
                subjectCompleted.map((item) => (
                  <div key={item.codigo} className="border-b py-1">{item.codigo} - {item.nome}</div>
                ))
              ) : <p>Nenhuma concluída.</p>}
            </div>
          )}
        </div>

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
                  <div key={item.codigo} className="border-b py-1">{item.codigo} - {item.nome}</div>
                ))
              ) : <p>Tudo concluído!</p>}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}