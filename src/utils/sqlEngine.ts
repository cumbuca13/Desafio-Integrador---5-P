import { Cliente, Produto, Pedido } from '../types';

export interface SQLResult {
  columns: string[];
  rows: any[];
  error?: string;
  queryTimeMs: number;
}

/**
 * A highly robust virtual SGBD engine to execute SQL queries on the relational state
 * of Clientes, Produtos, Pedidos, and Itens de Pedido.
 * This directly supports the academic requirement "consultas SQL via SGBD".
 */
export function executeVirtualSQL(
  query: string,
  state: { clientes: Cliente[]; produtos: Produto[]; pedidos: Pedido[] }
): SQLResult {
  const startTime = performance.now();
  
  try {
    // 1. Sanitize query
    let sanitized = query.trim().replace(/;+$/, '').replace(/\s+/g, ' ');
    if (!sanitized.toUpperCase().startsWith('SELECT')) {
      throw new Error("Este SGBD acadêmico suporta comandos SELECT para modelagem e extração de dados.");
    }

    // 2. Extrair tabelas virtuais do estado
    const tb_clientes = state.clientes;
    const tb_produtos = state.produtos;
    const tb_pedidos = state.pedidos;
    
    // Aplanar itens de pedido em uma tabela relacional de ligação N:M
    const tb_itens_pedido: any[] = [];
    tb_pedidos.forEach(p => {
      p.itens.forEach(it => {
        tb_itens_pedido.push({
          pedidoId: p.id,
          produtoId: it.produtoId,
          nomeProduto: it.nomeProduto,
          quantidade: it.quantidade,
          precoUnitario: it.precoUnitario,
          subtotal: it.quantidade * it.precoUnitario,
          status: p.status,
          data: p.data
        });
      });
    });

    const tablesMap: Record<string, any[]> = {
      clientes: tb_clientes,
      produtos: tb_produtos,
      pedidos: tb_pedidos,
      itens_pedido: tb_itens_pedido
    };

    // 3. RegEx de Parsing Simples e Robusto
    // Suporta: SELECT <campos> FROM <tabela> [JOIN <tabela2> ON <condicao>] [WHERE <condicao>] [GROUP BY <campos>] [ORDER BY <campo> [DESC]] [LIMIT <n>]
    const queryUpper = sanitized.toUpperCase();
    
    // Identificar a tabela principal
    const fromIndex = queryUpper.indexOf(' FROM ');
    if (fromIndex === -1) {
      throw new Error("Erro de sintaxe SQL: Cláusula 'FROM' obrigatória ausente.");
    }

    const selectClause = sanitized.substring(7, fromIndex).trim();
    let restOfQuery = sanitized.substring(fromIndex + 6).trim();

    // Extrair tokens
    let mainTable = '';
    let joinTable = '';
    let joinCondition = '';
    let whereCondition = '';
    let groupByClause = '';
    let orderByClause = '';
    let limitValue = 100;

    // Localizar cláusulas sequencialmente de forma robusta
    const getClauseIndices = (str: string) => {
      const parts = [' LIMIT ', ' ORDER BY ', ' GROUP BY ', ' WHERE ', ' JOIN '];
      const indices: { clause: string; idx: number }[] = [];
      parts.forEach(p => {
        const i = str.toUpperCase().indexOf(p);
        if (i !== -1) {
          indices.push({ clause: p.trim(), idx: i });
        }
      });
      return indices.sort((a, b) => a.idx - b.idx);
    };

    const clauses = getClauseIndices(restOfQuery);
    
    // O nome da tabela principal vai do início até a primeira cláusula ou o fim
    if (clauses.length > 0) {
      mainTable = restOfQuery.substring(0, clauses[0].idx).trim();
    } else {
      mainTable = restOfQuery.trim();
    }

    // Processar JOIN, WHERE, GROUP BY, ORDER BY, LIMIT
    let workStr = restOfQuery;
    
    // LIMIT
    const limitIdx = workStr.toUpperCase().indexOf(' LIMIT ');
    if (limitIdx !== -1) {
      const limitStr = workStr.substring(limitIdx + 7).trim();
      const match = limitStr.match(/^(\d+)/);
      if (match) limitValue = parseInt(match[1], 10);
      workStr = workStr.substring(0, limitIdx).trim();
    }

    // ORDER BY
    const orderIdx = workStr.toUpperCase().indexOf(' ORDER BY ');
    if (orderIdx !== -1) {
      orderByClause = workStr.substring(orderIdx + 10).trim();
      workStr = workStr.substring(0, orderIdx).trim();
    }

    // GROUP BY
    const groupIdx = workStr.toUpperCase().indexOf(' GROUP BY ');
    if (groupIdx !== -1) {
      groupByClause = workStr.substring(groupIdx + 10).trim();
      workStr = workStr.substring(0, groupIdx).trim();
    }

    // WHERE
    const whereIdx = workStr.toUpperCase().indexOf(' WHERE ');
    if (whereIdx !== -1) {
      whereCondition = workStr.substring(whereIdx + 7).trim();
      workStr = workStr.substring(0, whereIdx).trim();
    }

    // JOIN
    const joinIdx = workStr.toUpperCase().indexOf(' JOIN ');
    if (joinIdx !== -1) {
      const joinStr = workStr.substring(joinIdx + 6).trim();
      const onIdx = joinStr.toUpperCase().indexOf(' ON ');
      if (onIdx === -1) {
        throw new Error("Erro de sintaxe SQL: Cláusula JOIN exige condição 'ON'.");
      }
      joinTable = joinStr.substring(0, onIdx).trim();
      joinCondition = joinStr.substring(onIdx + 4).trim();
      mainTable = workStr.substring(0, joinIdx).trim();
    }

    // 4. Resolver aliases e tabela principal
    // Tabelas podem vir acompanhadas de aliases (Ex: clientes c ou clientes AS c)
    const parseTableName = (tStr: string) => {
      const parts = tStr.split(/\s+AS\s+|\s+/i);
      return {
        name: parts[0].toLowerCase().trim(),
        alias: parts[1] ? parts[1].trim() : parts[0].toLowerCase().trim()
      };
    };

    const mainTableParsed = parseTableName(mainTable);
    if (!tablesMap[mainTableParsed.name]) {
      throw new Error(`Erro SQL: Tabela '${mainTableParsed.name}' não existe no metadados do SGBD.`);
    }

    let dataset: any[] = JSON.parse(JSON.stringify(tablesMap[mainTableParsed.name]));

    // Acoplar alias na tabela principal
    dataset = dataset.map(row => {
      const aliasedRow: Record<string, any> = {};
      Object.keys(row).forEach(k => {
        aliasedRow[`${mainTableParsed.alias}.${k}`] = row[k];
        // Manter chave original no lookup direto para simplificar WHERE sem alias
        aliasedRow[k] = row[k];
      });
      return aliasedRow;
    });

    // 5. Aplicar JOIN se houver
    if (joinTable) {
      const joinTableParsed = parseTableName(joinTable);
      if (!tablesMap[joinTableParsed.name]) {
        throw new Error(`Erro SQL: Tabela de junção '${joinTableParsed.name}' não existe.`);
      }

      // Separar as duas partes da condição ON (ex: c.id = p.clienteId)
      const onParts = joinCondition.split('=');
      if (onParts.length !== 2) {
        throw new Error(`Erro SQL: Condição de JUNÇÃO inválida '${joinCondition}'. Use '='.`);
      }

      const leftKey = onParts[0].trim();
      const rightKey = onParts[1].trim();

      const joinDataset = JSON.parse(JSON.stringify(tablesMap[joinTableParsed.name]));
      const joinedResult: any[] = [];

      dataset.forEach(leftRow => {
        joinDataset.forEach((rightRowRaw: any) => {
          // Criar cópia alinhada com alias da tabela direita
          const rightRow: Record<string, any> = {};
          Object.keys(rightRowRaw).forEach(k => {
            rightRow[`${joinTableParsed.alias}.${k}`] = rightRowRaw[k];
            rightRow[k] = rightRowRaw[k];
          });

          // Comparar chaves
          const getVal = (row: any, keyStr: string) => {
            if (row[keyStr] !== undefined) return row[keyStr];
            // Se tiver alias ou subfield
            return undefined;
          };

          const valL = getVal(leftRow, leftKey) || getVal(rightRow, leftKey);
          const valR = getVal(leftRow, rightKey) || getVal(rightRow, rightKey);

          if (valL !== undefined && valR !== undefined && String(valL) === String(valR)) {
            // Mesclar as linhas
            joinedResult.push({ ...leftRow, ...rightRow });
          }
        });
      });

      dataset = joinedResult;
    }

    // 6. Aplicar filtração (WHERE)
    if (whereCondition) {
      // Suporte simples para condições como "cidade = 'São Paulo'", "valorTotal > 2000", "status = 'concluido'"
      // e "AND/OR" básicos
      const filterRow = (row: any, cond: string): boolean => {
        // Remover parênteses superficiais
        let expression = cond.trim();
        
        // Suporta AND simples
        if (expression.toUpperCase().includes(' AND ')) {
          const parts = expression.split(/\s+AND\s+/i);
          return parts.every(p => filterRow(row, p));
        }
        if (expression.toUpperCase().includes(' OR ')) {
          const parts = expression.split(/\s+OR\s+/i);
          return parts.some(p => filterRow(row, p));
        }

        // Operadores de comparação: >=, <=, >, <, =, !=, LIKE
        const ops = ['>=', '<=', '!=', '=', '>', '<', ' LIKE '];
        let foundOp = '';
        ops.forEach(o => {
          if (!foundOp && expression.toUpperCase().includes(o)) {
            foundOp = o;
          }
        });

        if (!foundOp) return true; // se vazia ou não reconhecida, ignora filtro

        const opIdx = expression.toUpperCase().indexOf(foundOp);
        let key = expression.substring(0, opIdx).trim();
        let valStr = expression.substring(opIdx + foundOp.length).trim();

        // Limpar valor (remover aspas simples/duplas)
        let cleanVal: any = valStr.replace(/^['"]|['"]$/g, '');
        
        // Obter valor do registro
        let rowVal = row[key];
        if (rowVal === undefined) {
          // tentar com o alias extraído
          rowVal = row[key.toLowerCase()];
        }

        if (rowVal === undefined) {
          // retornar falso ou ignorar se chave não existir
          return false;
        }

        // Converte tipos numéricos
        if (!isNaN(Number(rowVal)) && !isNaN(Number(cleanVal)) && typeof rowVal !== 'string') {
          rowVal = Number(rowVal);
          cleanVal = Number(cleanVal);
        } else {
          rowVal = String(rowVal).toLowerCase();
          cleanVal = String(cleanVal).toLowerCase();
        }

        const opLower = foundOp.trim().toUpperCase();
        if (opLower === '=') return rowVal === cleanVal;
        if (opLower === '!=') return rowVal !== cleanVal;
        if (opLower === '>') return rowVal > cleanVal;
        if (opLower === '<') return rowVal < cleanVal;
        if (opLower === '>=') return rowVal >= cleanVal;
        if (opLower === '<=') return rowVal <= cleanVal;
        
        if (opLower === 'LIKE') {
          const regexStr = cleanVal.replace(/%/g, '.*');
          const regex = new RegExp(`^${regexStr}$`);
          return regex.test(rowVal);
        }

        return true;
      };

      dataset = dataset.filter(r => filterRow(r, whereCondition));
    }

    // 7. Aplicar GROUP BY e Funções de Agregação (COUNT, SUM, AVG)
    // Se houver funções de agregação no SELECT, ou GROUP BY explícito
    const selectFields = selectClause.split(',').map(f => f.trim());
    const hasAggregation = selectFields.some(f => {
      const u = f.toUpperCase();
      return u.includes('COUNT(') || u.includes('SUM(') || u.includes('AVG(') || u.includes('MIN(') || u.includes('MAX(');
    });

    if (groupByClause || hasAggregation) {
      const groupKeys = groupByClause ? groupByClause.split(',').map(k => k.trim()) : [];
      const groups: Record<string, any[]> = {};

      dataset.forEach(row => {
        // Formar a chave do grupo
        const gKeyVals = groupKeys.map(gk => {
          return row[gk] !== undefined ? String(row[gk]) : 'ALL';
        });
        const gKey = gKeyVals.join('##');

        if (!groups[gKey]) groups[gKey] = [];
        groups[gKey].push(row);
      });

      // Calcular agregações para cada grupo
      const aggregatedResult: any[] = [];
      
      Object.keys(groups).forEach(gKey => {
        const rowsInGroup = groups[gKey];
        const representativeRow = rowsInGroup[0];
        const groupedRow: Record<string, any> = {};

        // Injetar valores de chaves de agrupamento
        groupKeys.forEach(gk => {
          groupedRow[gk] = representativeRow[gk];
        });

        // Avaliar cada expressão selecionada
        selectFields.forEach(f => {
          const uField = f.toUpperCase();
          const cleanAlias = f.replace(/.*?\s+AS\s+/i, '').trim();

          if (uField.startsWith('COUNT(')) {
            // COUNT(*) ou COUNT(campo)
            const countArg = f.substring(f.indexOf('(') + 1, f.indexOf(')')).trim();
            if (countArg === '*') {
              groupedRow[cleanAlias] = rowsInGroup.length;
            } else {
              groupedRow[cleanAlias] = rowsInGroup.filter(r => r[countArg] !== null && r[countArg] !== undefined).length;
            }
          } else if (uField.startsWith('SUM(')) {
            const sumArg = f.substring(f.indexOf('(') + 1, f.indexOf(')')).trim();
            const total = rowsInGroup.reduce((sum, r) => {
              const val = Number(r[sumArg]);
              return sum + (isNaN(val) ? 0 : val);
            }, 0);
            groupedRow[cleanAlias] = total;
          } else if (uField.startsWith('AVG(')) {
            const avgArg = f.substring(f.indexOf('(') + 1, f.indexOf(')')).trim();
            const total = rowsInGroup.reduce((sum, r) => {
              const val = Number(r[avgArg]);
              return sum + (isNaN(val) ? 0 : val);
            }, 0);
            groupedRow[cleanAlias] = rowsInGroup.length > 0 ? (total / rowsInGroup.length) : 0;
          } else if (uField.startsWith('MAX(')) {
            const maxArg = f.substring(f.indexOf('(') + 1, f.indexOf(')')).trim();
            const vals = rowsInGroup.map(r => Number(r[maxArg])).filter(v => !isNaN(v));
            groupedRow[cleanAlias] = vals.length > 0 ? Math.max(...vals) : 0;
          } else if (uField.startsWith('MIN(')) {
            const minArg = f.substring(f.indexOf('(') + 1, f.indexOf(')')).trim();
            const vals = rowsInGroup.map(r => Number(r[minArg])).filter(v => !isNaN(v));
            groupedRow[cleanAlias] = vals.length > 0 ? Math.min(...vals) : 0;
          } else {
            // Campos normais não agrupados (pegar do primeiro registro do grupo se solicitado)
            if (representativeRow[f] !== undefined) {
              groupedRow[f] = representativeRow[f];
            }
          }
        });

        aggregatedResult.push(groupedRow);
      });

      dataset = aggregatedResult;
    }

    // 8. Projetar campos selecionados (SELECT)
    let columns: string[] = [];
    let finalRows: any[] = [];

    if (selectClause === '*') {
      // Obter todas as colunas disponíveis do primeiro registro
      if (dataset.length > 0) {
        // Organizar colunas de forma semântica (remover aliases redundantes de lookup no mapeamento final)
        const keys = Object.keys(dataset[0]);
        // Filtrar apenas campos com ponto (reais aliased) ou simples se não houver alias
        const hasAliased = keys.some(k => k.includes('.'));
        columns = keys.filter(k => {
          if (hasAliased) return k.includes('.');
          return true;
        });
      } else {
        // Colunas genéricas vazias
        columns = ['Resultado'];
      }
      
      finalRows = dataset.map(row => {
        const projected: Record<string, any> = {};
        columns.forEach(col => {
          projected[col] = row[col];
        });
        return projected;
      });
    } else {
      // Avaliar explicitamente os campos no selectClause
      columns = selectFields.map(f => {
        // Remover aliases AS do cabeçalho da coluna
        const parts = f.split(/\s+AS\s+/i);
        return parts[parts.length - 1].trim();
      });

      finalRows = dataset.map(row => {
        const projected: Record<string, any> = {};
        selectFields.forEach(f => {
          const parts = f.split(/\s+AS\s+/i);
          const origName = parts[0].trim();
          const targetName = parts[parts.length - 1].trim();
          
          let val = row[origName];
          if (val === undefined) {
            // tentar lookup secundário insensível a maiúsculas/minúsculas
            val = row[origName.toLowerCase()];
          }
          if (val === undefined) {
            // tentar lookup sem alias se o campo tiver alias
            if (origName.includes('.')) {
              val = row[origName.split('.')[1]];
            }
          }
          projected[targetName] = val !== undefined ? val : null;
        });
        return projected;
      });
    }

    // 9. Aplicar ORDER BY se houver
    if (orderByClause) {
      const orderParts = orderByClause.split(/\s+/);
      const orderKey = orderParts[0].trim();
      const orderDir = orderParts[1] && orderParts[1].toUpperCase() === 'DESC' ? -1 : 1;

      finalRows.sort((a, b) => {
        let valA = a[orderKey];
        let valB = b[orderKey];

        if (valA === undefined || valA === null) return 1 * orderDir;
        if (valB === undefined || valB === null) return -1 * orderDir;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * orderDir;
        }

        return String(valA).localeCompare(String(valB)) * orderDir;
      });
    }

    // 10. Aplicar LIMIT
    finalRows = finalRows.slice(0, limitValue);

    const queryTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
    
    // Simplificar nomes de colunas para exibição na UI (remover prefixos de tabela como 'clientes.')
    const displayColumns = columns.map(c => c.replace(/^[a-zA-Z0-9_]+\./, ''));
    const displayRows = finalRows.map(row => {
      const cleanRow: Record<string, any> = {};
      Object.keys(row).forEach(k => {
        const cleanKey = k.replace(/^[a-zA-Z0-9_]+\./, '');
        cleanRow[cleanKey] = row[k];
      });
      return cleanRow;
    });

    return {
      columns: displayColumns,
      rows: displayRows,
      queryTimeMs
    };

  } catch (err: any) {
    return {
      columns: ['Erro'],
      rows: [],
      error: err.message || String(err),
      queryTimeMs: Math.round((performance.now() - startTime) * 100) / 100
    };
  }
}
