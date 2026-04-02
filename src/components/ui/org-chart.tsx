'use client';

import React, { useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  NodeProps,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ----------------- CUSTOM NODE -----------------

function OrgNode({ data }: NodeProps) {
  const { label, role, employment, count } = data as {
    label: string;
    role?: 'ceo' | 'manager' | 'executive';
    employment?: 'FT' | 'PT';
    count?: string;
  };

  const isCEO = role === 'ceo';
  const isManager = role === 'manager';
  const isFT = employment === 'FT';
  const isPT = employment === 'PT';

  let bg = '#1E293B';
  let border = '1px solid #334155';
  let color = '#E2E8F0';
  let borderStyle = 'solid';
  let fontWeight = 500;

  if (isCEO) {
    bg = '#7C3AED';
    border = '1px solid #6D28D9';
    fontWeight = 700;
    color = '#FFFFFF';
  } else if (isManager) {
    border = '2px solid #7C3AED';
  }

  if (isPT) {
    borderStyle = 'dashed';
  }

  return (
    <div
      style={{
        background: bg,
        border: border,
        borderStyle: borderStyle,
        borderRadius: '12px',
        padding: '10px 14px',
        color: color,
        fontWeight: fontWeight,
        fontSize: '14px',
        width: '160px', /* Fix width to guarantee center alignment on smoothstep edges */
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        fontFamily: 'var(--font-inter), sans-serif',
      }}
      className="org-node"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#A78BFA';
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(124, 58, 237, 0.2)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isManager ? '#7C3AED' : (isCEO ? '#6D28D9' : '#334155');
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#334155', border: 'none' }} />
      
      <div>{label}</div>
      {employment && (
        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
          {employment}
        </div>
      )}
      {count && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#EC4899',
            color: 'white',
            borderRadius: '999px',
            padding: '2px 8px',
            fontSize: '10px',
            fontWeight: 700,
            border: '2px solid #0F172A',
          }}
        >
          {count === 'n' ? '× n' : `× ${count}`}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: '#334155', border: 'none' }} />
    </div>
  );
}

// ----------------- DATA & LAYOUT -----------------

const initialNodes = [
  // CEO
  { id: 'ceo', type: 'org', data: { label: 'Ban Giám đốc (CEO)', role: 'ceo' }, position: { x: 700, y: 0 } },
  
  // L1
  { id: 'mkt', type: 'org', data: { label: 'Phòng Marketing' }, position: { x: 400, y: 120 } },
  { id: 'ops', type: 'org', data: { label: 'Phòng Vận hành' }, position: { x: 1000, y: 120 } },

  // MKT sub
  { id: 'mkt-mgr', type: 'org', data: { label: 'Marketing Manager', role: 'manager', count: '1' }, position: { x: 400, y: 240 } },
  
  { id: 'content', type: 'org', data: { label: 'Team Content' }, position: { x: 50, y: 360 } },
  { id: 'content-ldr', type: 'org', data: { label: 'Leader Content', role: 'manager', employment: 'FT' }, position: { x: 50, y: 460 } },
  { id: 'content-exe', type: 'org', data: { label: 'Nhân viên Content', role: 'executive', employment: 'PT', count: 'n' }, position: { x: 50, y: 560 } },

  { id: 'live', type: 'org', data: { label: 'Team Livestream' }, position: { x: 350, y: 360 } },
  { id: 'live-host', type: 'org', data: { label: 'Host LIVE', role: 'executive', employment: 'PT' }, position: { x: 250, y: 460 } },
  { id: 'live-sup', type: 'org', data: { label: 'Trợ LIVE', role: 'executive', employment: 'PT' }, position: { x: 450, y: 460 } },

  { id: 'cskh', type: 'org', data: { label: 'Team CSKH' }, position: { x: 650, y: 360 } },
  { id: 'cskh-ldr', type: 'org', data: { label: 'Leader CSKH', role: 'manager', employment: 'FT' }, position: { x: 650, y: 460 } },
  { id: 'cskh-exe', type: 'org', data: { label: 'Nhân viên CSKH', role: 'executive', employment: 'PT', count: 'n' }, position: { x: 650, y: 560 } },

  { id: 'booking', type: 'org', data: { label: 'Team Booking' }, position: { x: 850, y: 360 } },
  { id: 'booking-ldr', type: 'org', data: { label: 'Leader Booking', role: 'manager', employment: 'FT' }, position: { x: 850, y: 460 } },
  { id: 'booking-exe', type: 'org', data: { label: 'Nhân viên Booking', role: 'executive', employment: 'PT', count: 'n' }, position: { x: 850, y: 560 } },

  // OPS sub
  { id: 'admin', type: 'org', data: { label: 'Admin Vận hành', role: 'manager', employment: 'FT' }, position: { x: 1000, y: 240 } },
  { id: 'wh', type: 'org', data: { label: 'Kho (Warehouse)' }, position: { x: 1300, y: 240 } },
  { id: 'wh-ft', type: 'org', data: { label: 'Nhân viên Kho', role: 'executive', employment: 'FT', count: 'n' }, position: { x: 1200, y: 360 } },
  { id: 'wh-pt', type: 'org', data: { label: 'Nhân viên Kho', role: 'executive', employment: 'PT', count: 'n' }, position: { x: 1400, y: 360 } },
];

const edgeProps = {
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#475569', strokeWidth: 2 }
};

const initialEdges: Edge[] = [
  { id: 'e-ceo-mkt', source: 'ceo', target: 'mkt', ...edgeProps },
  { id: 'e-ceo-ops', source: 'ceo', target: 'ops', ...edgeProps },
  
  { id: 'e-mkt-mgr', source: 'mkt', target: 'mkt-mgr', ...edgeProps },
  { id: 'e-mgr-content', source: 'mkt-mgr', target: 'content', ...edgeProps },
  { id: 'e-mgr-live', source: 'mkt-mgr', target: 'live', ...edgeProps },
  { id: 'e-mgr-cskh', source: 'mkt-mgr', target: 'cskh', ...edgeProps },
  { id: 'e-mgr-booking', source: 'mkt-mgr', target: 'booking', ...edgeProps },

  { id: 'e-cont-ldr', source: 'content', target: 'content-ldr', ...edgeProps },
  { id: 'e-ldr-exe', source: 'content-ldr', target: 'content-exe', ...edgeProps },

  { id: 'e-live-host', source: 'live', target: 'live-host', ...edgeProps },
  { id: 'e-live-sup', source: 'live', target: 'live-sup', ...edgeProps },

  { id: 'e-cskh-ldr', source: 'cskh', target: 'cskh-ldr', ...edgeProps },
  { id: 'e-cskh-exe', source: 'cskh-ldr', target: 'cskh-exe', ...edgeProps },

  { id: 'e-book-ldr', source: 'booking', target: 'booking-ldr', ...edgeProps },
  { id: 'e-book-exe', source: 'booking-ldr', target: 'booking-exe', ...edgeProps },

  { id: 'e-ops-admin', source: 'ops', target: 'admin', ...edgeProps },
  { id: 'e-ops-wh', source: 'ops', target: 'wh', ...edgeProps },
  { id: 'e-wh-ft', source: 'wh', target: 'wh-ft', ...edgeProps },
  { id: 'e-wh-pt', source: 'wh', target: 'wh-pt', ...edgeProps },
];

// ----------------- COMPONENT -----------------

export default function OrganizationalChart() {
  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);
  const nodeTypes = useMemo(() => ({ org: OrgNode }), []);

  return (
    <div style={{ width: '100%', height: '600px', background: '#0F172A', borderRadius: '16px', overflow: 'hidden', border: '1px solid #1E293B' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1E293B" gap={16} size={2} />
      </ReactFlow>
    </div>
  );
}
