import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface JsonTreeViewerProps {
  data: any;
  expandedByDefault?: boolean;
  className?: string;
  title?: string;
  maxInitialDepth?: number;
}

export function JsonTreeViewer({
  data,
  expandedByDefault = false,
  className,
  title,
  maxInitialDepth = 1
}: JsonTreeViewerProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "JSON data has been copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("rounded-lg border", className)}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted">
          <h3 className="font-medium">{title}</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={copyToClipboard}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            {copied ? "Copied!" : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      )}
      <div className="p-4 overflow-auto max-h-[600px] text-sm font-mono bg-muted/20">
        <JsonNode
          data={data}
          name="root"
          isRoot
          expandedByDefault={expandedByDefault}
          currentDepth={0}
          maxInitialDepth={maxInitialDepth}
        />
      </div>
    </div>
  );
}

interface JsonNodeProps {
  data: any;
  name: string;
  isRoot?: boolean;
  expandedByDefault?: boolean;
  currentDepth: number;
  maxInitialDepth: number;
}

function JsonNode({
  data,
  name,
  isRoot = false,
  expandedByDefault = false,
  currentDepth,
  maxInitialDepth
}: JsonNodeProps) {
  const [expanded, setExpanded] = useState(
    expandedByDefault || currentDepth < maxInitialDepth
  );
  
  // Determine the type of data
  const type = Array.isArray(data) 
    ? 'array' 
    : (data === null 
      ? 'null' 
      : typeof data);
  
  // Format different data types
  const isExpandable = type === 'object' || type === 'array';
  const isEmpty = isExpandable && Object.keys(data || {}).length === 0;
  
  const toggleExpand = () => {
    if (isExpandable) {
      setExpanded(!expanded);
    }
  };
  
  const getTypeBadge = () => {
    let color;
    switch (type) {
      case 'string': color = 'bg-green-100 text-green-800 border-green-200'; break;
      case 'number': color = 'bg-blue-100 text-blue-800 border-blue-200'; break;
      case 'boolean': color = 'bg-purple-100 text-purple-800 border-purple-200'; break;
      case 'object': color = 'bg-yellow-100 text-yellow-800 border-yellow-200'; break;
      case 'array': color = 'bg-pink-100 text-pink-800 border-pink-200'; break;
      case 'null': color = 'bg-gray-100 text-gray-800 border-gray-200'; break;
      default: color = 'bg-gray-100 text-gray-800 border-gray-200';
    }
    return (
      <Badge 
        variant="outline" 
        className={cn('px-1.5 ml-2 font-normal text-xs', color)}
      >
        {type}{type === 'array' && ` (${data.length})`}
      </Badge>
    );
  };
  
  const formatValue = (val: any) => {
    if (val === null) return <span className="text-gray-500">null</span>;
    if (val === undefined) return <span className="text-gray-500">undefined</span>;
    if (typeof val === 'string') return <span className="text-green-600">"{val}"</span>;
    if (typeof val === 'number') return <span className="text-blue-600">{val}</span>;
    if (typeof val === 'boolean') return <span className="text-purple-600">{val.toString()}</span>;
    return val.toString();
  };
  
  return (
    <div className={cn("ml-0", !isRoot && "ml-4")}>
      <div 
        className={cn(
          "py-1 flex items-start hover:bg-muted/30 rounded cursor-pointer -ml-1 pl-1",
          isExpandable ? "cursor-pointer" : "cursor-default"
        )}
        onClick={toggleExpand}
      >
        {isExpandable ? (
          <div className="mr-1 w-4 h-4 flex items-center justify-center">
            {expanded 
              ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> 
              : <ChevronRight className="h-3 w-3 text-muted-foreground" />
            }
          </div>
        ) : (
          <div className="w-4 h-4" />
        )}
        
        <div className="flex-1">
          {!isRoot && (
            <span className="text-muted-foreground">
              {typeof name === 'number' ? '[' + name + ']' : name}:
            </span>
          )}
          
          {isExpandable ? (
            <>
              <span className="ml-1">
                {type === 'array' ? '[' : '{'}
                {isEmpty && (type === 'array' ? ']' : '}')}
              </span>
              {getTypeBadge()}
              {!isEmpty && !expanded && <span className="ml-1 text-muted-foreground">...</span>}
              {!isEmpty && !expanded && <span className="ml-1">{type === 'array' ? ']' : '}'}</span>}
            </>
          ) : (
            <>
              <span className="ml-1">{formatValue(data)}</span>
              {getTypeBadge()}
            </>
          )}
        </div>
      </div>
      
      {isExpandable && expanded && !isEmpty && (
        <div className="border-l border-muted pl-3 ml-1">
          {Object.entries(data).map(([key, value], index) => (
            <JsonNode
              key={`${key}-${index}`}
              name={key}
              data={value}
              expandedByDefault={expandedByDefault}
              currentDepth={currentDepth + 1}
              maxInitialDepth={maxInitialDepth}
            />
          ))}
          <div className="py-1 pl-1">
            <span>{type === 'array' ? ']' : '}'}</span>
          </div>
        </div>
      )}
    </div>
  );
}