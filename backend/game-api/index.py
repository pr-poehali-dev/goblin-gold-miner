import json
import os
import psycopg2
import random
from datetime import datetime, timedelta
from decimal import Decimal

def get_db_connection():
    '''Подключение к БД'''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def generate_memo():
    '''Генерация уникального 6-значного MEMO кода'''
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def handler(event: dict, context) -> dict:
    '''API для игровой логики: регистрация, начисление золота, покупка гоблинов'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        query_params = event.get('queryStringParameters') or {}
        action = query_params.get('action', 'init')
        
        if action == 'init' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'user_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT id, memo_code, goblins, gold, ton_balance, last_harvest FROM players WHERE user_id = %s", (user_id,))
            player = cur.fetchone()
            
            if player:
                player_id, memo, goblins, gold, ton_balance, last_harvest = player
                
                now = datetime.now()
                hours_passed = (now - last_harvest).total_seconds() / 3600
                
                if hours_passed >= 1:
                    gold_earned = Decimal(str(goblins * 0.014 * int(hours_passed)))
                    new_gold = float(gold) + float(gold_earned)
                    
                    cur.execute(
                        "UPDATE players SET gold = %s, last_harvest = %s WHERE id = %s",
                        (new_gold, now, player_id)
                    )
                    
                    cur.execute(
                        "INSERT INTO gold_harvests (player_id, gold_earned, goblins_count) VALUES (%s, %s, %s)",
                        (player_id, float(gold_earned), goblins)
                    )
                    
                    conn.commit()
                    gold = new_gold
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'player_id': player_id,
                        'memo': memo,
                        'goblins': goblins,
                        'gold': float(gold),
                        'ton_balance': float(ton_balance)
                    }),
                    'isBase64Encoded': False
                }
            
            else:
                memo = generate_memo()
                while True:
                    cur.execute("SELECT id FROM players WHERE memo_code = %s", (memo,))
                    if not cur.fetchone():
                        break
                    memo = generate_memo()
                
                cur.execute(
                    "INSERT INTO players (user_id, memo_code) VALUES (%s, %s) RETURNING id, goblins, gold, ton_balance",
                    (user_id, memo)
                )
                player_id, goblins, gold, ton_balance = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'player_id': player_id,
                        'memo': memo,
                        'goblins': goblins,
                        'gold': float(gold),
                        'ton_balance': float(ton_balance)
                    }),
                    'isBase64Encoded': False
                }
        
        elif action == 'buy-goblins' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            package = body.get('package')
            
            packages = {
                'small': {'goblins': 3000, 'price': 1},
                'large': {'goblins': 15000, 'price': 5}
            }
            
            if package not in packages:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Неверный пакет'}),
                    'isBase64Encoded': False
                }
            
            pkg = packages[package]
            
            cur.execute("SELECT id, ton_balance, goblins FROM players WHERE user_id = %s", (user_id,))
            player = cur.fetchone()
            
            if not player:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Игрок не найден'}),
                    'isBase64Encoded': False
                }
            
            player_id, ton_balance, current_goblins = player
            
            if float(ton_balance) < pkg['price']:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Недостаточно TON'}),
                    'isBase64Encoded': False
                }
            
            new_balance = float(ton_balance) - pkg['price']
            new_goblins = current_goblins + pkg['goblins']
            
            cur.execute(
                "UPDATE players SET ton_balance = %s, goblins = %s WHERE id = %s",
                (new_balance, new_goblins, player_id)
            )
            
            cur.execute(
                "INSERT INTO transactions (player_id, type, amount, description) VALUES (%s, %s, %s, %s)",
                (player_id, 'goblin_purchase', pkg['price'], f"Куплено {pkg['goblins']} гоблинов")
            )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'new_balance': new_balance,
                    'new_goblins': new_goblins
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'exchange-gold' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            gold_amount = float(body.get('gold_amount', 0))
            
            if gold_amount < 100:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Минимум 100 кг золота'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT id, gold, goblins FROM players WHERE user_id = %s", (user_id,))
            player = cur.fetchone()
            
            if not player:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Игрок не найден'}),
                    'isBase64Encoded': False
                }
            
            player_id, current_gold, current_goblins = player
            
            if float(current_gold) < gold_amount:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Недостаточно золота'}),
                    'isBase64Encoded': False
                }
            
            goblins_received = int((gold_amount / 100) * 95)
            new_gold = float(current_gold) - gold_amount
            new_goblins = current_goblins + goblins_received
            
            cur.execute(
                "UPDATE players SET gold = %s, goblins = %s WHERE id = %s",
                (new_gold, new_goblins, player_id)
            )
            
            cur.execute(
                "INSERT INTO transactions (player_id, type, amount, description) VALUES (%s, %s, %s, %s)",
                (player_id, 'gold_exchange', gold_amount, f"Обменяно {gold_amount} кг золота на {goblins_received} гоблинов")
            )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'new_gold': new_gold,
                    'new_goblins': new_goblins,
                    'goblins_received': goblins_received
                }),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Endpoint не найден'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()