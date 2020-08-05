import {Request, Response} from 'express';
import db from '../database/connection';
import converterHourToMinutes from '../utils/converterHourToMinutes';

interface ScheduleItem {
    week_day: string;
    from: string;
    to: string;
}

export default class ClassesControllers {

    public async index(request : Request, response : Response){
        const filters = request.query;

        if(!filters.week_day || !filters.subject || !filters.time){
            return response.status(400).json({
                status: 'Error',
                message: 'É necessário informar todos os filtros'
            });
        }

        const timeInMinutes = converterHourToMinutes(filters.time as string);

        const classes = await db('classes')
            .whereExists(function(){
                this.select('class_schedule.*')
                    .from('class_schedule')
                    .whereRaw(' `class_schedule`.`class_id` = `classes`.`id` ')
                    .whereRaw(' `class_schedule`.`week_day` = ?? ',[Number(filters.week_day)]).whereRaw(' `class_schedule`.`from` <= ?? ',[timeInMinutes])
                    .whereRaw(' `class_schedule`.`to` > ?? ',[timeInMinutes])
            })
            .where('classes.subject', '=', filters.subject as string)
            .join('users','classes.user_id','=','users.id')
            .select(['classes.*', 'users.*']);

        return response.json(classes);
    }

    public async create(request : Request, response : Response){
        const data = request.body;
    
        const trx = await db.transaction();
    
        try {
    
            const insertedUserIds = await trx('users').insert({
                name: data.name,
                avatar: data.avatar,
                whatsapp: data.whatsapp,
                bio: data.bio,
            });
    
            const userId = insertedUserIds[0];
    
            const insertedClassesIds = await trx('classes').insert({
                subject: data.subject,
                cost: data.cost,
                user_id: userId,
            });
    
            const classId = insertedClassesIds[0];
    
            const classSchedule = data.schedule.map((item: ScheduleItem) => {
                return {
                    class_id: classId,
                    week_day: item.week_day,
                    from: converterHourToMinutes(item.from),
                    to: converterHourToMinutes(item.to),
                }
            });
    
            await trx('class_schedule').insert(classSchedule);
    
            await trx.commit();
    
            return response.status(201).json(
                {
                    status: 'Sucesso',
                    message: 'Sucesso ao realizar o cadastro'
                }
            );
        } catch (error) {
            await trx.rollback();
    
            console.error(error);
    
            return response.status(400).json(
                {
                    status: 'Error',
                    message: 'Erro ao realizar o cadastro'
                }
            );
        }
    }
}